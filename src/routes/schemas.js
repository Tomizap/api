const express = require("express");
const router = express.Router();
const {mongo} = require("@tomizap/tools");

router.get("/:schema", (req, res) => {
  try {
    schema = require(`./${req.params.schema}.js`);
    res.json({
      ok: true,
      schema,
    });
  } catch (error) {
    res.json({
      ok: false,
      message: error,
    });
  }
});

module.exports = router;
