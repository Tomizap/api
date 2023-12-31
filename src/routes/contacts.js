const express = require("express");
const mongo = require("../db/mongo");
const router = express.Router();
// const { ObjectId } = require("mongodb");
const { google } = require("googleapis");
const crypto = require("crypto");
const fs = require("fs");
const { ObjectId } = require("mongodb");

GOOGLE_CLIENT_ID =
  "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com";
GOOGLE_CLIENT_SECRET = "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";

router.use("/companies", async (req, res, next) => {
  req.companies = await mongo({
    db: "contacts",
    collection: "companies",
  });
  next();
});

// const companies = require("../../data/contacts.companies.json");
// console.log("le");
// console.log(companies);

router.get("/companies", async (req, res) => {
  res.json(req.companies);
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
router.get("/companies/GoogleSpreadSheet", async (req, res) => {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: req.user.auth.google.refresh_token,
  });
  const sheets = google.sheets({ version: "v4", auth: oauth2Client });

  const fileName =
    // req.automnation.name.replace(/[\/:*?"<>|+\s]/gm, "_") +
    // "_" +
    new Date(Date.now()).toISOString().split("T")[0] +
    "T" +
    new Date(Date.now()).getHours() +
    ":" +
    new Date(Date.now()).getMinutes();

  const spreadsheetId = await createSpreadsheet(sheets, fileName);
  // const companies = await req.companies
  var companies = require("../../data/contacts.companies.json");
  if (companies.length > 9999) companies = companies.slice(0, 100);
  await writeToSpreadsheet(sheets, spreadsheetId, companies || [{}]);

  // console.log(`Feuille de calcul créée avec l'ID : ${spreadsheetId}`);

  res.redirect("https://docs.google.com/spreadsheets/d/" + spreadsheetId);
});

// DOWNLOAD CSV
function createCsvDowload(data, fileName) {
  csv = Object.keys(data[0]).join("|") + "\n";
  csv += data.map((row) => Object.values(row).join("|")).join("\n");
  const filePath =
    "C:\\Users\\Conta\\Desktop\\CODE\\api.tom-zapico.com\\download\\" +
    fileName +
    ".csv";
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
// createCsvDowload(
//   require("../../data/contacts.companies.json"),
//   "testing_export"
// );
router.get("/companies/download", async (req, res) => {
  const fileName =
    // req.automnation.name.replace(/[\/:*?"<>|+\s]/gm) +
    // "_" +
    new Date(Date.now()).toISOString().split("T")[0] +
    "_" +
    crypto
      .randomBytes(Math.ceil(10 / 2))
      .toString("hex") // Convertit les octets en une chaîne hexadécimale
      .slice(0, 10); // Retourne la longueur souhaitée;
  // const companies = await req.companies
  var companies = require("../../data/contacts.companies.json");
  createCsvDowload(
    companies,
    fileName.replace(/[\\/:*?"<>|+]/g, "-").replace(" ", "")
  );
  res.redirect(`/download/${fileName}.csv`);
});

async function delete_duplicate(config = {}) {
  const mongo_db = config.db || "contacts";
  const mongo_collection = config.collection || "companies";

  await mongo({
    db: mongo_db,
    collection: mongo_collection,
  }).then(async (items) => {
    for (let index = 0; index < items.length; index++) {
      console.log("item: " + index);
      const item = items[index];

      const duplicates = await mongo({
        db: mongo_db,
        collection: mongo_collection,
        selector: {
          $or: [
            { SOURCE_URL: item.SOURCE_URL },
            { COMPANY_PHONE: item.COMPANY_PHONE },
          ],
        },
      });
      if (duplicates.length > 1) {
        console.log("duplicates found: " + duplicates.slice(1).length);
        for (const duplicate of duplicates.slice(1)) {
          await mongo({
            db: mongo_db,
            collection: mongo_collection,
            action: "delete",
            selector: {
              $or: [{ _id: new ObjectId(duplicate._id) }],
            },
          }).then((r) => {
            console.log(r);
          });
        }
      }
    }
  });
}
router.get("/companies/delete_duplicate", async (req, res) => {
  await delete_duplicate();
  res.json("ok");
});

module.exports = router;
