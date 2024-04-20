const express = require("express");
const router = express.Router();
const fs = require("fs");
// const { v4: uuidv4 } = require('uuid');

// ------------------------------ CONTACTS ---------------------------
router.get('/', async (req, res) => {
  data = {};

  for (const contact_type of [
    'companies',
    'profils'
  ]) {
    data[contact_type] = await req.api.mongo.exec({
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

// // FOCUS CONTACT TYPE
// router.use("/:type", async (req, res, next) => {
//   req.mongoConfig = {
//     db: "contacts",
//     collection: req.params.type,
//     limit: req.query.limit,
//     page: req.query.page
//   }
//   delete req.query.limit
//   delete req.query.page
//   req.items = []

//   req.schema = await req.api.schemas.find(s => s.type === req.params.type)
//     .then(r => r[0] || null)
//   if (req.schema !== null) {
//     req.schema = req.schema
//   } else {
//     return res.json({
//       ok: false,
//       message: `${req.params.type} has no schema`
//     })
//   }

//   next();
// });

// // GET CONTACT
// router.get('/:type', async (req, res) => {
//   req.mongoConfig.selector = req.query
//       const items = await req.api.mongo.exec(req.mongoConfig)
//       return res.json({
//         ok: true,
//         data: items
//       });
// })
// // OPTIONS CONTACT
// router.options('/:type', async (req, res) => {
//   return res.json({
//     ok: true,
//     data: req.shema
//   });
// })
// // POST CONTACT
// router.post('/:type', async (req, res) => {
//   const contact = await req.body
//   res.json(await req.api.items.add(contact))
// })

// RICH CONTACT COLLECTION
// router.get('/:type/rich', async (req, res) => {
//   const items = await req.api.mongo.exec({
//     db: "contacts",
//     collection: req.params.type,
//     limit: req.query.limit,
//     page: req.query.page
//   })
//   for (const item of items) {
//     if (item.LOCATION !== "") {
//       const regex = /\d{5}/
//       let match
//       if ((match = regex.exec(chaine)) !== null) {
//         var POSTCODE = match[0] 
//         if (item.POSTCODE === "") {

//         }
//       }
//     }
//   }
// })

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
  const data = await req.api.mongo.exec({
    db: "contacts",
    collection: req.params.type,
    limit: req.query.limit,
    page: req.query.page
  })
  const fileName = new Date(Date.now()).toISOString()
    .replace(/[\\/:*?"<>|+]/g, "-").replace(" ", "")
  createCsvDowload(data, fileName);
  res.redirect(`/download/${fileName}.csv`);
});

// JSON

// ------------------------------- IMPORT -------------------------------

// SPREADSHEET
router.get('/:type/import/spreadsheet/:id/:sheetname', async (req, res) => {
  const items = await req.api.google.spreadsheet.get(req.params.id, req.params.sheetname, req.oauth2Client);
  console.log('importing contacts');
  for (const item of items) {
    console.log(`${req.params.type} ${items.indexOf(item)}`);
    if (item.NAME === '' || !item.NAME || !item.PHONE || item.PHONE === "") continue
    // console.log(item);
    console.log(
      await req.api.contacts.add_contact(item, req.schema)
    ); 
  }
  res.json(items)
})

// CSV

// JSON

// -------------------------------- CLEAR -------------------------------

// router.use("/:type/clear", async (req, res) => {
//   items = []
//   if (req.method === 'GET') {
//     items = await req.api.mongo.exec({
//       db: "contacts",
//       collection: req.params.type,
//       limit: req.query.limit || 99999
//     })  
//     console.log('items ', items.length);
//   } else if (req.method === "POST") {
//     items = await req.body
//   }

//   items = await req.api.items.clear.all(items)

//   console.log('end clear.');
//   // return items
//   res.json({ok: true, data: items});
// });

// ------------------------------- CONTACT ------------------------------ 

// // FOCUS
// router.use('/:type/:id', async (req, res, next) => {
//   const getting = await req.api.mongo.exec({
//     db: 'contacts',
//     collection: req.params.type,
//     selector: {_id: req.params.id}
//   })
//   if (getting.length > 0) {
//     req.item = getting[0]
//   } else {
//     return res.status(404).json({ok:false, 'message': 'no item found'})
//   }

//   if (req.method === "GET") {
//     return res.json({
//       ok: true,
//       data: req.item
//     })
//   } else if (req.method === "PUT ") {
//     req.mongoConfig.action = 'edit'
//     req.mongoConfig.updator = await req.body
//     update = await req.api.mongo.exec(req.mongoConfig)
//     res.json(update)
//   } else if (req.method === "OPTIONS") {
//     return res.json(req.schema)
//   }

//   next()
// })

module.exports = router;