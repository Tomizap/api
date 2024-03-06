const express = require("express");
// const mongo = require("../db/mongo");
const router = express.Router();

router.get('/', (req, res) => {res.send('stripe')})

module.exports = router