async function auth(req, res, next) {
  const headers = req.headers;
  // const email = await (req.query.email || headers.email || req.cookies.email)
  const token = await (req.query.token || headers.token || req.cookies.token)
  var user = {}

  const quickAuth = await req.api.mongo.exec({
    collection: "users",
    selector: { ['auth.token']: token }
  })

  if (!quickAuth) return res.json({
    ok: false,
    message: "internal error: quickAuth"
  })

  if (quickAuth.length > 0) {
    user = quickAuth[0]
  } else {
    return res.json({
      ok: false,
      message: "auth failed"
    })
    // const credentiels = {
    //   email,
    //   auth: {
    //     token,
    //     password,
    //   }
    // };
    // // console.log("auth credentiels", credentiels);
    // const login = await user_login(credentiels);
    // if (login.ok !== true) return res.json(login);
    // user = login.user
  }

  req.response.user = user;
  req.user = user;
  req.response.ok = true;

  res.cookie("email", req.user.email);
  res.cookie("token", req.user.auth.token);

  delete req.query.token
  delete req.query.password

  await req.api.init({
    keys: {
      GOOGLE_REFRESH_TOKEN: req.user.auth.google.refresh_token,
    }
  })

  // console.log('auth ok');

  next();
}

module.exports = auth;