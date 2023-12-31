const express = require("express");
const router = express.Router();
const mongo = require("../db/mongo.js");
const internshipSchema = require("../db/schemas/internships.js");

router.get("/", async (req, res) => {
  const internships = await mongo("get", "internships", {
    usersAccess: { $in: [req.user.email] },
  });
  return res.json({
    ok: true,
    data: internships,
  });
});

router.post("/", async (req, res) => {
  console.log(internship);
  var internship = await req.body;
  for (const key in internshipSchema) {
    if (Object.hasOwnProperty(internship, key)) {
      internship[key] = internshipSchema[key];
    }
  }

  internship = await mongo("add", "internships", internship);
  return res.json({
    ok: internship.acknowledged,
    data: {
      _id: internship.insertedId,
    },
  });
});

module.exports = router;
