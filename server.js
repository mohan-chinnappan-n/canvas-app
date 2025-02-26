const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const QRCode = require("qrcode");
const decode = require("salesforce-signed-request");

const app = express();
const consumerSecret = process.env.CONSUMER_SECRET;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));

app.post("/signedrequest", async (req, res) => {
  try {
    const signedRequest = decode(req.body.signed_request, consumerSecret);
    const context = signedRequest.context;
    const oauthToken = signedRequest.client.oauthToken;
    const instanceUrl = signedRequest.client.instanceUrl;

    const query = `SELECT Id, FirstName, LastName, Phone, Email FROM Contact WHERE Id = '${context.environment.record.Id}'`;

    // Make Salesforce API request
    const contactResponse = await axios.get(`${instanceUrl}/services/data/v59.0/query?q=${query}`, {
      headers: {
        Authorization: `OAuth ${oauthToken}`,
      },
    });

    const contact = contactResponse.data.records[0];

    if (!contact) {
      return res.status(404).send("Contact not found");
    }

    // Generate QR Code data
    const qrText = `MECARD:N:${contact.LastName},${contact.FirstName};TEL:${contact.Phone};EMAIL:${contact.Email};;`;

    // Generate QR Code as a Data URL
    QRCode.toDataURL(qrText, (err, qrUrl) => {
      if (err) {
        console.error("QR Code generation failed:", err);
        return res.status(500).send("Error generating QR Code");
      }

      // Pass the QR code image tag to EJS
      res.render("index", { context: context, imgTag: `<img src="${qrUrl}" alt="QR Code"/>` });
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("An error occurred while processing the request");
  }
});

app.set("port", process.env.PORT || 8000);

app.listen(app.get("port"), () => {
  console.log(`Express server listening on port ${app.get("port")}`);
});
