const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  res.redirect('/oauth/google');
});

router.get("/google", async (req, res) => {
  req.api.google.oauth2Client.redirectUri = `http://localhost:3000/oauth/google/token`;
  if (!req.query.scopes)
    req.query.scopes = "https://mail.google.com,https://www.googleapis.com/auth/contacts,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/calendar";
  const url = req.api.google.oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: req.query.scopes.split(","),
  });

  res.redirect(url);
});

router.get("/google/token", (req, res) => {
  // return res.json(req.query.code)
  req.api.google.oauth2Client.getToken(req.query.code, async (err, tokens) => {
    if (err) {
      console.log("Erreur lors de l'obtention du token", err);
      return res.json({
        ok: false,
        message: err.response.data.error,
        data: err.response.data,
      });
    }
    // console.log("Tokens obtenus:", tokens);
    await req.api.mongo.exec({
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