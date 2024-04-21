const express = require("express");
const router = express.Router();

// ---------------------- DB --------------------------

// FOCUS
router.use('/:db', (req, res, next) => {
    console.log(req.params.db);
    next()
})

// ---------------------- COLLECTION --------------------------

// FOCUS
router.use("/:db/:type", async (req, res, next) => {
    req.mongoConfig = {
      db: req.params.db,
      collection: req.params.type,
      limit: req.query.limit,
      page: req.query.page
    }
    delete req.query.limit
    delete req.query.page
    req.items = []
  
    req.schema = await (req.api.schemas || []).find(s => s.type === req.params.type) || null
    if (req.schema !== null) {
      req.schema = req.schema
    } else {
      return res.status(404).json({
        ok: false,
        message: `${req.params.type} has no schema`
      })
    }
    console.log(req.params.type);
    next();
});
// GET
router.get('/:db/:type', async (req, res) => {
    req.mongoConfig.selector = req.query
    const items = await req.api.mongo.exec(req.mongoConfig)
    return res.json({
        ok: true,
        data: items
    });
})
// OPTIONS
router.options('/:db/:type', async (req, res) => {
return res.json({
    ok: true,
    data: req.shema
});
})
// POST
router.post('/:db/:type', async (req, res) => {
    const item = await req.body
    if (!item._db) item._db = req.params.db
    if (!item._type) item._type = req.params.type
    // return res.json("salut")
    res.json(await req.api.item.add(item))
})

// ---------------------- ITEM --------------------------

// FOCUS
router.use('/:db/:type/:id', async (req, res, next) => {
    const getting = await req.api.mongo.exec({
      db: 'contacts',
      collection: req.params.type,
      selector: {_id: req.params.id}
    })
    if (getting.length > 0) {
      req.item = getting[0]
    } else {
      return res.status(404).json({ok:false, 'message': 'no item found'})
    }

    next()
})
// GET
router.get('/:db/:type/:id', (req, res) => {
    res.json({
        ok: true,
        data: req.item
    })
})
// PUT
router.put('/:db/:type/:id', async (req, res) => {
    req.mongoConfig.action = 'edit'
    req.mongoConfig.updator = await req.body
    update = await req.api.mongo.exec(req.mongoConfig)
    res.json(update)
})
// DELETE
router.delete('/:db/:type/:id', (req, res) => {

})

// ---------------------- ACTIONS --------------------------

// ACCESS
router.use('/:db/:type/:id/access/add/:email', (req, res) => {

})
router.use('/:db/:type/:id/access/revoke/:email', (req, res) => {

})

module.exports = router