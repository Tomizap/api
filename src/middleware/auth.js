const { user_login } = require("../db/functions.js");
const mongo = require("../db/mongo.js");
const { google } = require("googleapis");

GOOGLE_CLIENT_ID = "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com";
GOOGLE_CLIENT_SECRET = "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";

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
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  await req.oauth2Client.setCredentials({
    refresh_token: req.user.auth.google.refresh_token,
  });

  next();
}
module.exports = auth;
