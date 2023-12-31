const { user_login } = require("../db/functions.js");
// const { getCababilitiesByRole } = require("../db/capabilities.js");

async function auth(req, res, next) {
  const headers = req.headers;
  // console.log(headers);

  const user = {
    email: req.query.email || headers.email || req.cookies.email,
    token: req.query.token || headers.token || req.cookies.token,
    password: req.query.password || headers.password || req.cookies.password,
  };
  // console.log(user);

  const login = await user_login(user);
  // console.log("login: ", login);
  if (login.ok !== true) return res.json(login);

  // console.log(login);

  // req.user = login.user;
  req.response.user = login.user;
  req.user = login.user;
  req.response.ok = true;

  // console.log("user: ", req.user);
  res.cookie("email", req.response.user.email);
  res.cookie("token", req.response.user.token);
  next();
}
module.exports = auth;
