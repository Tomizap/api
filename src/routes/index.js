const express = require("express");
const routes = express.Router();
const mongo = require("../db/mongo.js");

// HOME
routes.get("/", (req, res) => res.send("Bienvenue sur l'api"));

// REGISTER

// -------------------- AUTHENTIFICATE REQUEST ---------------------
routes.use(require("../middleware/auth.js"));

// Interact with a mongo
routes.post("/", async (req, res) => {
  // console.log(req.body);
  req.response.data = await mongo(req.body);
  // console.log(req.response.data);
  req.response.ok = 
    !req.response.data || 
    req.response.data.acknowledged || 
    req.response.data.length > 0 ? true : false;
  req.response.message = req.response.ok || req.response.data.acknowledged ? 
    "operation success" : 
    "operation fail";
  req.response.config = req.body
  return res.json(req.response);
});

// GET USER
routes.get(["/me", '/auth'], (req, res) => {
  res.json({
    ok: true,
    message: 'authentifaction réussie !',
    user: req.user,
  });
});

// OAuth
routes.use("/oauth", require("./oauth.js"));

// Google
routes.use("/google", require("./google.js"));

// Emailing
routes.use("/email", require("./email.js"));

// Download file from data
routes.use("/download", require("./downloads.js"));

// Get documents of mongo collection
// routes.get("/mongo/:db/:collection", async (req, res) => {
//   req.body.db = req.params.db 
//   req.body.collection = req.params.collection 
//   req.body.selector = req.query

//   req.response.data = await mongo({
//     db: req.params.db,
//     collection: req.params.collection,
//     selector: req.query
//   });
//   req.response.ok = req.response.data.length > 0 ? true : false;
//   req.response.message = req.response.ok ? "" : "Aucune ressource trouvée";
//   return res.json(req.response);
// });

// Appointments
routes.use("/appointments", require("./appointments.js"));

// Schemas
routes.use("/schemas", require("./schemas.js"));

// Automnations
routes.use("/automnations", require("./automnations.js"));

// Contacts
routes.use("/contacts", require("./contacts.js"));

module.exports = routes;
