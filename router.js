const express = require("express");

const router = express.Router();
const crudController = require('./controllers/crud.controller.js')
const subItemController = require('./controllers/subitem.controller.js')
const exportController = require('./controllers/export.controller.js')
const importController = require('./controllers/import.controller.js')
const emailController = require('./controllers/email.controller.js')
const googleController = require('./controllers/google.controller.js')
// const SpiderController = require('./controllers/spider.controller.js')

// third party
router.post("/google/gmail/send", googleController.gmail.send)
// router.use("/stripe", require('./controllers/stripe.controller.js'))    

// get collection
router.get('/:collection', async (req, res) => res.json(await crudController.read(req, res)));

// spiders
// router.put('/spiders/:id/play', SpiderController.play)
// router.get('/spiders/:id/pause', SpiderController.pause)
// router.get('/spiders/:id/stop', SpiderController.stop)

// import spreadsheet
router.get('/:collection/import/spreadsheet', importController.spreadsheet);
router.get('/:collection/import/json', importController.json);

// export
router.get('/:collection/export/spreadsheet', exportController.spreadsheet);
router.get('/:collection/export/csv', exportController.csv);
router.get('/:collection/export/json', exportController.json);

// create a item
router.post("/:collection", async (req, res) => res.json(await crudController.create(req, res)));

// get an item
router.use("/:collection/:id", crudController.readOne)
router.get("/:collection/:id", (req, res) => res.json(req.item));

// update a item
router.put("/:collection/:id", crudController.update);

// sailing
// router.put("/:collection/:id/convert");
// router.put("/:collection/:id/disqualify");
// router.put("/:collection/:id/blacklist");

// item emailing
router.post("/:collection/:id/email/send", emailController.send);

// subItem
router.put("/:collection/:id/add/:type", subItemController.add);
router.get("/:collection/:id/extend", subItemController.extend);
router.get("/:collection/:id/extend/:type", subItemController.extend);
router.delete("/:collection/:id/remove/:type/:subItemId", subItemController.remove);
router.delete("/:collection/:id/delete/:type/:subItemId", subItemController.delete);

// item permissions

// share item

// delete a item
router.delete("/:collection/:id", crudController.delete);

module.exports = router;