const { google } = require("googleapis");

const express = require("express");
const router = express.Router();
const mongo = require("../db/mongo.js");
// const axios = require("axios");

// const oauth2Client = new google.auth.OAuth2(
//   "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com", // YOUR_CLIENT_ID
//   "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", // YOUR_CLIENT_SECRET
//   "http://api.tom-zapico.com/oauth/google/callback" // YOUR_REDIRECT_URI
// );

router.get("/", async (req, res) => {
  res.redirect('/oauth/google');
});

router.get("/google", async (req, res) => {
  // req.oauth2Client.redirectUri = "http://localhost:3000/oauth/google/token";

  // res.json(req.oauth2Client);

  if (!req.query.scopes)
    req.query.scopes = "https://mail.google.com,https://www.googleapis.com/auth/contacts,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/calendar";
    // req.query.scopes = "https://www.googleapis.com/auth/contacts";

  const url = req.oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: req.query.scopes.split(","),
  });

  res.redirect(url);
});

router.get("/google/token", (req, res) => {
  req.oauth2Client.getToken(req.query.code, async (err, tokens) => {
    if (err) {
      // console.log("Erreur lors de l'obtention du token", err);
      return res.json({
        ok: false,
        message: `Error: ${err}`,
      });
    }
    // console.log("Tokens obtenus:", tokens);
    await mongo({
      collection: "users",
      action: "edit",
      selector: {
        email: req.user.email,
      },
      updator: {
        $set: {
          "auth.google": tokens,
        },
      },
    });
    res.json({
      ok: true,
      data: tokens,
    });
  });
});

module.exports = router;
