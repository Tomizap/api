const express = require("express");
const router = express.Router();

// const { google } = require("googleapis");
const nodemailer = require("nodemailer");
// const mongo = require("../db/mongo.js");
// const axios = require("axios");

GOOGLE_CLIENT_ID =
  "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com";
GOOGLE_CLIENT_SECRET = "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";
// GOOGLE_REDIRECT_URI = "https://api.tom-zapico.com";

// const oauth2Client = new google.auth.OAuth2(
//   GOOGLE_CLIENT_ID,
//   GOOGLE_CLIENT_SECRET
//   // "http://api.tom-zapico.com/oauth/google/callback" // GOOGLE_REDIRECT_URI
// );

router.post("/send", async (req, res) => {
  const API = req.body.api || "google";
  const result = {
    ok: false,
    data: {},
  };

  try {
    if (API === "google") {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: req.user.email,
          clientId: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          refreshToken: req.user.auth.google.refresh_token,
          // accessToken: accessToken.token,
        },
      });

      const mailOptions = {
        from: `Expéditeur <${req.user.email}>`,
        to: req.body.to || "zaptom.pro@gmail.com",
        subject: req.body.subject || "Sujet",
        html: req.body.html || "Contenu de l'e-mail en html",
        text: req.body.text || "Contenu de l'e-mail en texte",
      };

      result.data = await transporter.sendMail(mailOptions);
    } else {
      result.message = "API invalide";
      res.json(result);
    }
  } catch (error) {
    result.ok = false;
    result.message = error;
    return res.json(result);
  }

  result.ok = true;
  res.json(result);
});

module.exports = router;
