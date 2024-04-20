const express = require("express");
const router = express.Router();
const routes = require("./routes/index.js");
const {api} = require('@tomizap/tools')

router.use((req, res, next) => {
  req.api = api
  // return res.json(process.env.MONGO_URI)
  req.api.init({
    keys: {
        MONGO_URI: process.env.MONGO_URI,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID, 
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET, 
        // GOOGLE_GMAIL: process.env.GOOGLE_GMAIL, 
    }
})
  req.response = {
    ok: false,
    message: "",
    user: {},
    data: [],
  };
  next();
});

router.use(routes);

router.use((req, res) => {
  res.json({
    ok: false,
    message: 'not found'
  })
})

module.exports = router;
