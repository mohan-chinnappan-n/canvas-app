const express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    qrcode = require('qrcode-npm'),
    decode = require('salesforce-signed-request');

    const consumerSecret = process.env.CONSUMER_SECRET; 

app = express();

app.set('view engine', 'ejs');
app.use(bodyParser()); // pull information from html in POST
app.use(express.static(__dirname + '/public'));

app.post('/signedrequest', function(req, res) {

    const signedRequest = decode(req.body.signed_request, consumerSecret),
        context = signedRequest.context,
        oauthToken = signedRequest.client.oauthToken,
        instanceUrl = signedRequest.client.instanceUrl,

        query = "SELECT Id, FirstName, LastName, Phone, Email FROM Contact WHERE Id = '" + context.environment.record.Id + "'";
        console.log(oauthToken)
        console.log(context.environment.record.Id);
        const contactRequest = {
            url: instanceUrl + '/services/data/v59.0/query?q=' + query,
            headers: {
                'Authorization': 'OAuth ' + oauthToken
            }
        };

        // console.log(contactRequest);

    request(contactRequest, function(err, response, body) {
        let qr = qrcode.qrcode(4, 'L'),
        contact = JSON.parse(body).records[0];
        console.log(contact);
         let text = 'MECARD:N:' + contact.LastName + ',' + contact.FirstName + ';TEL:' + contact.Phone + ';EMAIL:' + contact.Email + ';;';
         qr.addData(text);
        qr.make();
        const imgTag = qr.createImgTag(4);
        res.render('index', {context: context, imgTag: imgTag});

    });

});

app.set('port', process.env.PORT || 8000);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});