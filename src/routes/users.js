const express = require("express");
const router = express.Router();
const { user_registration, user_login } = require("../db/functions.js");

router.post("/", async function (req, res) {
  res.json(await user_registration(req.body));
});

router.post("/login", async function (req, res) {
  console.log("login");
  res.json(await user_login(req.body));
});

module.exports = router;
