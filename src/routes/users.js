const express = require("express");
const router = express.Router();
const { user_registration, user_login } = require("../db/functions.js");

router.post("/", async function (req, res) {
  res.json(await user_registration(req.body));
});

// router.post("/login", async function (req, res) {
//   console.log("login");
//   const login = await user_login(req.body)
//   if (login.ok === true) {
//     res.cookie("email", login.user.email);
//     res.cookie("token", login.user.auth.token);
//   }
//   res.json(login);
// });

module.exports = router;
