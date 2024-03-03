const express = require("express");
const router = express.Router();
// const { user_registration, user_login } = require("../db/functions.js");

router.use("/", express.static("download"));
router.post("/", async (req, res) => {
  const body = await req.body;
  const filename = body.filename || generateRandomString(20);
  const data = body.data || [];
  createCsvDowload(data, filename);
});

module.exports = router;
