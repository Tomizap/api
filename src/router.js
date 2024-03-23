const express = require("express");
const router = express.Router();
const routes = require("./routes/index.js");

router.use((req, res, next) => {
  req.api = require('./api.js')
  req.response = {
    ok: false,
    message: "",
    user: {},
    data: [],
  };
  next();
});

router.use(routes);

module.exports = router;
