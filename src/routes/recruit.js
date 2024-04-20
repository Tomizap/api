const express = require("express");
const router = express.Router();


router.get('/cv_proposal', async (req, res) => {
    const appliers = await req.api.google.spreadsheet.get('1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw', "CANDIDATS", req.oauth2Client)
    // console.log(appliers.length);
    res.json(req.api.recruit.cv_proposal(req.query, appliers))
})

module.exports = router