const { user_login } = require("../db/functions.js");
const mongo = require("../db/mongo.js");
const { google } = require("googleapis");

// GOOGLE_CLIENT_ID = "377435728989-i79vfsatmkfjic6628g0u3h85ui6jh19.apps.googleusercontent.com";
// GOOGLE_CLIENT_SECRET = "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";

async function auth(req, res, next) {
  const headers = req.headers;
  // console.log(headers);

  const email = await (req.query.email || headers.email || req.cookies.email)
  const token = await (req.query.token || headers.token || req.cookies.token)
  const password = await (req.query.password || headers.password || req.cookies.password)

  var user = {}
  const quickAuth = await mongo({
    collection: "users",
    selector: {['auth.token']: token}
  })

  if (!quickAuth) return res.json({
    ok: false,
    message: "internal error: quickAuth"
  })

  if (quickAuth.length > 0) {
    user = quickAuth[0]
  } else {
    const credentiels = {
      email,
      auth: {
        token,
        password,
      }
    };
    // console.log("auth credentiels", credentiels);
    const login = await user_login(credentiels);
    if (login.ok !== true) return res.json(login);
    user = login.user
  }

  req.response.user = user;
  req.user = user;
  req.response.ok = true;
  
  res.cookie("email", req.response.user.email);
  res.cookie("token", req.response.user.auth.token);

  req.oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID, 
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/oauth/google/token"
    );
  await req.oauth2Client.setCredentials({
    refresh_token: req.user.auth.google.refresh_token, 
  });

  const oAuth2Client = req.oauth2Client

  req.google = {
    calendar: await google.calendar({ version: 'v3', auth: oAuth2Client }),
    drive: await google.drive({ version: 'v3', auth: oAuth2Client }),
    sheets: await google.sheets({ version: 'v4', auth: oAuth2Client }),
    drive: await google.drive({ version: 'v3', auth: oAuth2Client }),
    gmail: await google.gmail({ version: 'v1', auth: oAuth2Client }),
  }
  req.api.google.client = req.google

  next();
}
module.exports = auth;
