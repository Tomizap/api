const express = require("express");
const router = express.Router();
const mongo = require("../db/mongo.js");

router.get("/", async (req, res) => {
  req.response.data = {};

  for (const ressource of [
    {
      db: "contacts",
      collection: "profils",
    },
    {
      db: "contacts",
      collection: "companies",
    },
    {
      db: "tools",
      collection: "automnations",
    },
  ]) {
    if (!req.response.data[ressource.db]) req.response.data[ressource.db] = {};
    req.response.data[ressource.db][ressource.collection] = await mongo({
      db: ressource.db,
      collection: ressource.collection,
      // selector: { userAccess: { $in: [req.response.user.email] } },
    });
  }

  res.json(req.response);
});

module.exports = router;
