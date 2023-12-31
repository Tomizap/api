const nodemailer = require("nodemailer");
// const mongo = require("../db/mongo.js");
// const axios = require("axios");

GOOGLE_CLIENT_ID =
  "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com";
GOOGLE_CLIENT_SECRET = "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";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "zaptom.pro@gmail.com",
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    refreshToken: req.user.auth.google.refresh_token,
    // accessToken: accessToken.token,
  },
});

const mailOptions = {
  from: `Expéditeur <zaptom.pro@gmail.com>`,
  to: req.body.to || "zaptom.pro@gmail.com",
  subject: req.body.subject || "Sujet",
  html: req.body.html || "N'oublie jamais",
  text: req.body.text || "Contenu de l'e-mail en texte",
};

result.data = await transporter.sendMail(mailOptions);
