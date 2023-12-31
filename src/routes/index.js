const express = require("express");
const routes = express.Router();
// const auth = require("../middleware/auth.js");
const mongo = require("../db/mongo.js");

// HOME
routes.get("/", (req, res) => res.send("Bienvenue sur l'api"));

// USER LOGIN AND REGISTER
routes.use("/users", require("./users.js"));

// AUTHENTIFACATE REQUEST
routes.use(require("../middleware/auth.js"));

// AUTHENTIFACATE REQUEST
routes.use(require("../middleware/update.js"));

// GET USER
routes.get("/auth", (req, res) => {
  res.json({
    ok: true,
    user: req.user,
  });
});

// OAuth
routes.use("/oauth", require("./oauth.js"));

// Emailing
routes.use("/email", require("./email.js"));

// Download file from data
routes.use("/download", require("./downloads.js"));

// Interact with a mongo bdd
routes.post("/", async (req, res) => {
  const body = await req.body;

  req.response.data = await mongo(body);
  req.response.ok = req.response.data.length > 0 ? true : false;
  req.response.message = req.response.ok ? "" : "Aucune ressource trouvée";
  return res.json(req.response);
});

// Get all accessible ressources
routes.use("/schemas", require("./schemas.js"));
routes.use("/ressources", require("./ressources.js"));
routes.use("/automnations", require("./automnations.js"));

// Contacts
routes.use("/contacts", require("./contacts.js"));

module.exports = routes;
