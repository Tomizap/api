const express = require("express");
const mongo = require("../db/mongo");
const router = express.Router();
const fs = require("fs");
// const { ObjectId } = require("mongodb");
const { v4: uuidv4 } = require('uuid');
const api = require('../api.js')

GOOGLE_CLIENT_ID = "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com";
GOOGLE_CLIENT_SECRET = "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";

// ------------------------------ ITEMS ---------------------------
router.get('/', async (req, res) => {
  data = {};

  for (const contact_type of [
    'companies',
    'profils'
  ]) {
    data[contact_type] = await mongo({
      db: 'contacts',
      collection: contact_type,
      limit: req.query.limit,
      page: req.query.page
    });
  }

  res.json({
    ok: true,
    data
  });
})

// CLEAR ALL ITEMS
router.get('/clear', (req, res) => {
  res.json()
})

// SPECIFY ITEM TYPE
router.use("/:type", async (req, res, next) => {
  req.mongoConfig = {
    db: "contacts",
    collection: req.params.type,
    limit: req.query.limit,
    page: req.query.page
  }
  // req.items = await mongo(req.mongoConfig);
  req.items = []
  req.schema = await api.tools.get_schema(req.params.type)
  if (req.schema !== null) {
    req.schema = req.schema
  } else {
    return res.json({
      ok: false,
      message: `${req.params.type} has no schema`
    })
  }
  next();
});

// GET ITEMS
router.get("/:type", async (req, res) => {
  const items = await mongo({
    db: "contacts",
    collection: req.params.type,
    limit: req.query.limit,
    page: req.query.page
  })
  res.json(items);
});

// POST ITEM
router.post('/:type', async (req, res) => {
  const contact = await req.body
  res.json(await api.contacts.add_contact(contact, req.schema))
})

// OPTION COMPANIES
router.options("/:type", async (req, res) => {
  res.json(req.schema)
});

// ------------------------------ DOWNLOAD -----------------------------
router.get("/:type/download", async (req, res) => {
  res.redirect(req.path + '/csv')
})

// CSV
function createCsvDowload(data, fileName) {

  // mapping
  const mappedData = []
  const schema = data[0]
  for (const item of data) {
    const mappedItem = {}
    for (const field in schema) if (field.context !== "internal") {
      mappedItem[field] = item[field] || ''
    }
    mappedData.push(mappedItem)
  }

  console.log(mappedData.length);

  csv = Object.keys(mappedData[0]).join("|") + "\n";
  csv += mappedData.map((row) => Object.values(row).join("|")).join("\n");
  const filePath =
    "C:\\Users\\zapto\\Desktop\\api\\download\\" +
    fileName +
    ".csv";
  fs.writeFile(filePath, csv, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Le fichier ${filePath} a été créé avec succès!`);
  });
  return {
    download_url: "/download/" + fileName,
  };
}
router.get("/:type/download/csv", async (req, res) => {
  const data = await mongo({
    db: "contacts",
    collection: req.params.type,
    limit: req.query.limit || 99999,
    page: req.query.page
  })
  const fileName =
    new Date(Date.now()).toISOString().split("T")[0] +
    "_" +
    uuidv4()
  createCsvDowload(
    data,
    fileName.replace(/[\\/:*?"<>|+]/g, "-").replace(" ", "")
  );
  res.redirect(`/download/${fileName}.csv`);
});

// JSON

// ------------------------------- IMPORT -------------------------------

// SPREADSHEET
router.get('/:type/import/spreadsheet/:id/:sheetname', async (req, res) => {
  const items = await req.api.google.spreadsheet.get(req.params.id, req.params.sheetname, req.oauth2Client);
  console.log(items.length + ' ' + req.params.type);
  for (const item of items) {
    console.log(`${req.params.type} ${items.indexOf(item)}`);
    if (item.NAME === '' || !item.NAME || !item.PHONE || item.PHONE === "") continue
    // console.log(item);
    console.log(
      await api.contacts.add_contact(item, req.schema)
    ); 
  }
  res.json(items)
})

// CSV

// JSON

// -------------------------------- CLEAR -------------------------------

router.get("/:type/clear", async (req, res) => {

  const schemas = await mongo({collection: 'schemas' })
  const schema = schemas.find(s => s.type === req.params.type)

  items = await mongo({
    db: "contacts",
    collection: req.params.type,
    limit: req.query.limit || 99999
  })  
  console.log('items ', items.length);

  items = await api.tools.clear_items(items, schema)

  console.log('end clear.');
  // return items
  res.json({ok: true, data: items});
});

// ------------------------------- ITEM ------------------------------ 

// FOCUS

router.use('/:type/:id', async (req, res, next) => {
  const getting = await mongo({
    db: 'contacts',
    collection: req.params.type,
    selector: {_id: req.params.id}
  })
  if (getting.length > 0) {
    req.item = getting[0]
  } else {
    return res.status(404).json({ok:false, 'message': 'no item'})
  }
  next()
})

// GET
router.get("/:type/:id", (req, res) => {
  res.json(req.item);
});

// EDIT
router.put("/:type/:id", async (req, res) => {
  req.mongoConfig.action = 'edit'
  req.mongoConfig.updator = await req.body
  update = await mongo(req.mongoConfig)
  res.json(update)
});

// OPTIONS
router.options('/:type/:id/add/:subtype', (req, res) => {
  res.json(req.schema)
})

// ADD SUBITEM
router.post('/:type/:id/add/:subtype', async (req, res) => {
  // console.log("ADD SUBITEM");

  if (!req.item[req.params.subtype]) {
    return res.json({
      ok: false,
      message: `${req.params.subtype} is not a property of ${req.params.type}`
    })
  }

  const schema = await api.tools.get_schema(req.schema.fields[req.params.subtype].type)
  if (schema === null) {
    return res.json({
      ok: false,
      message: `${req.params.subtype} has no schema`
    })
  }
  // console.log('schema', schema);

  const creating = await api.contacts.add_contact(await req.body, schema)
  // console.log("creating", creating);

  if (creating.ok === true) {

    // console.log(creating.data._id.toString());
    // console.log({[req.params.subtype]: creating.data._id.toString()});

    const updating = await mongo({
      db: "contacts",
      collection: req.params.type,
      action: "edit",
      selector: {_id: req.params.id},
      updator: {$push: {[req.params.subtype]: creating.data._id.toString()}}
    })
    // console.log("updating", updating);
    res.json({
      ok: updating.acknowledged,
      message: `${req.params.subtype} has been created and added to ${req.params.type}`
    })

  } else {

    console.log("no creating: ", creating.message);
    if (creating.data._id) {
      res.redirect('/contacts/' + req.params.type + '/add/' + req.params.subtype + '/' + creating.data._id)
    } else {
      res.json({
        ok: false,
        message: "error // ADD SUBITEM" 
      })
    }

  }
})
router.get('/:type/:id/add/:subtype/:subitemid', async (req, res) => {
  if (!req.item[req.params.subtype]) {
    return res.json({
      ok: false,
      message: `${subtype} is not a property of ${req.params.type}`
    })
  }
  var subitem = await mongo({
    db: "contact",
    collection: req.params.subtype,
    selector: {uuid: req.params.subitemid}
  }) 
  if (subitem.length === 0) {
    return res.json({
      ok: false,
      message: `subitem doesn't exist`
    })
  }
  subitem = subitem[0]

  const pushing = await mongo({
    db: "contact",
    collection: req.params.type,
    action: "edit",
    selector: {uuid: req.item._uuid},
    updator: { $push: {[req.params.subtype]: req.params.subitemid} }
  })
  if (pushing.acknowledged === true) {
    res.json({
      ok: true
    })
  } else {
    res.json({
      ok: false,
      message: ""
    })
  }
})

// ------------------------------- COMPANY ------------------------------

// CV PROPOSAL
router.get('/:type/:id/cvproposal', (req, res) => {
  county = req.query.county
  job = req.query.job

  const appliers = mongo({
    db: 'contacts',
    collection: "profils",
    selector: {ROLE: "applier"}
  })

  res.json({
    ok: true
  })
})

// SCHEDULE APPOINTMENT

module.exports = router;
