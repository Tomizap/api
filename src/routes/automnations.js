const express = require("express");
const router = express.Router();
const {mongo} = require("@tomizap/tools");
const automnationSchema = require("../db/schemas/automnations.js");
const { ObjectId } = require("mongodb");
const { google } = require("googleapis");
const crypto = require("crypto");
const fs = require("fs");

GOOGLE_CLIENT_ID =
  "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com";
GOOGLE_CLIENT_SECRET = "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";

// ------------ CRUD ----------------

// GET AUTOMNATIONS
router.get("/", async (req, res) => {
  res.json(
    await mongo({
      collection: "automnations",
    })
      .then((r) => r)
      .catch((err) => [])
  );
});

// ADD AUTOMNATION
router.post("/", async (req, res) => {
  schema = require("../db/schemas/automnations.js");
  for (const key in schema) {
    if (req.body[key]) schema[key] = req.body[key];
  }
  schema.userAccess = [req.user.email];
  const creating_automnation = await mongo({
    collection: "automnations",
    action: "add",
    selector: schema,
  });
  // console.log(creating_automnation);
  if (creating_automnation.acknowledged === true) {
    const creating_storage = await mongo({
      collection: "storages",
      action: "add",
      selector: {
        name: "a storage",
        data: [],
        userAccess: [req.user.email],
      },
    });
    // console.log(creating_storage);
    if (creating_storage.acknowledged === true) {
      const creating_automnation_id =
        await creating_automnation.insertedId.toString();
      console.log(creating_automnation_id);
      const update = await mongo({
        collection: "automnations",
        action: "edit",
        selector: {
          _id: new ObjectId(creating_automnation_id),
        },
        updator: { $set: { storage: creating_storage.insertedId.toString() } },
      });
      console.log(update);
      if (update.acknowledged === true)
        return res.json({
          ok: true,
          message: "automnation successfuly created",
          data: {
            _id: creating_automnation.insertedId.toString(),
          },
        });
    }
  }
  res.json({
    ok: false,
    message: "un probleme est survenu",
  });
});

// ------------ TARGET AUTOMNATION ----------------

router.use("/:id", async (req, res, next) => {
  await mongo({
    collection: "automnations",
    selector: { _id: new ObjectId(req.params.id) },
  })
    .then(async (r) => {
      if (r.length === 0)
        return res.status(404).json({
          ok: false,
          message: "Cette automnation n'existe pas",
        });
      req.automnation = r[0];

      // await mongo({
      //   collection: "storages",
      //   selector: { _id: new ObjectId(req.automnation.storage) },
      // })
      //   .then((r) => {
      //     if (r.length === 0) req.storage = {};
      //     req.storage = r[0];
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //     req.storage = {};
      //   });
    })
    .catch((err) => {
      req.automnation = automnationSchema;
    });
  // return res.json(req.storage);
  next();
});

// GET AUTOMNATION
router.get("/:id", (req, res) => {
  res.json(req.automnation);
});

// ------------ RUNNING ----------------

// PLAY AUTOMNATION
router.get("/:id/play", async (req, res) => {
  const response = {};
  res.json(response);
});

// PAUSE AUTOMNATION
router.get("/:id/pause", async (req, res) => {
  const response = {};
  res.json(response);
});

// STOP AUTOMNATION
router.get("/:id/stop", async (req, res) => {
  const response = {};
  res.json(response);
});

// --------------------- DATA -----------------------

router.use("/:id/data", async (req, res, next) => {
  // console.log("store data");
  await mongo({
    collection: "storages",
    selector: { _id: new ObjectId(req.automnation.storage) },
  })
    .then((r) => {
      if (r.length === 0) req.storage = {};
      req.storage = r[0];
      // console.log(req.storages);
    })
    .catch((err) => {
      console.log(err);
      req.storage = {};
    });
  next();
});

// GET DATA
router.get("/:id/data", async (req, res) => {
  res.json(req.storage.data);
});

// DOWNLOAD CSV
function createCsvDowload(data, fileName) {
  csv = Object.keys(data[0]).join("|") + "\n";
  csv += data.map((row) => Object.values(row).join("|")).join("\n");
  const filePath =
    "D:\\CODE\\projects\\api.tom-zapico.com\\download\\" + fileName + ".csv";
  fs.writeFile(filePath, csv, (err) => {
    if (err) {
      throw err;
    }
    console.log(`Le fichier ${filePath} a été créé avec succès!`);
  });
  return {
    download_url: "http://localhost:7000/download/" + fileName,
  };
}
router.get("/:id/data/download", async (req, res) => {
  const fileName =
    req.automnation.name.replace(/[\/:*?"<>|+\s]/gm) +
    "_" +
    new Date(Date.now()).toISOString().split("T")[0] +
    "_" +
    crypto
      .randomBytes(Math.ceil(10 / 2))
      .toString("hex") // Convertit les octets en une chaîne hexadécimale
      .slice(0, 10); // Retourne la longueur souhaitée;
  createCsvDowload(
    req.storage.data,
    fileName.replace(/[\\/:*?"<>|+]/g, "-").replace(" ", "")
  );
  res.redirect(`/download/${fileName}.csv`);
});

// CREATE A GOOGLE SPREADSHEET
async function createSpreadsheet(sheets, title) {
  const response = await sheets.spreadsheets.create({
    resource: {
      properties: {
        title: title,
      },
    },
  });
  return response.data.spreadsheetId;
}
async function writeToSpreadsheet(sheets, spreadsheetId, data) {
  let values = data.map((obj) => Object.values(obj));
  values.unshift(Object.keys(data[0]));

  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: "A1", // Commence à la première cellule
    valueInputOption: "USER_ENTERED",
    resource: {
      values: values,
    },
  });
}
router.get("/:id/data/GoogleSpreadSheet", async (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: req.user.auth.google.refresh_token,
  });
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const fileName =
    req.automnation.name.replace(/[\/:*?"<>|+\s]/gm, "_") +
    "_" +
    new Date(Date.now()).toISOString().split("T")[0] +
    "T" +
    new Date(Date.now()).getHours() +
    ":" +
    new Date(Date.now()).getMinutes();

  const spreadsheetId = await createSpreadsheet(sheets, fileName);
  await writeToSpreadsheet(sheets, spreadsheetId, req.storage.data || []);

  console.log(`Feuille de calcul créée avec l'ID : ${spreadsheetId}`);

  res.redirect("https://docs.google.com/spreadsheets/d/" + spreadsheetId);
});

// ADD ITEM TO DATA
router.post("/:id/data", async (req, res) => {
  res.json(
    await mongo({
      collection: "storages",
      selector: { _id: new ObjectId(req.storage._id) },
      action: "edit",
      updator: {
        $push: {
          data: req.body,
        },
      },
    })
  );
});

// CLEAR DATA
router.get("/:id/data/clear", async (req, res) => {
  const data = req.storage.data;
});

// DELETE DATA
router.delete("/:id/data", async (req, res) => {
  const response = await mongo({
    collection: "storages",
    action: "edit",
    selector: { _id: new ObjectId(req.params.id) },
    updator: { $set: { data: [] } },
  });
  res.json(response);
});

module.exports = router;
