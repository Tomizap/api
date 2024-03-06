const express = require("express");
const routes = express.Router();
const mongo = require("../db/mongo.js");

// HOME
routes.get("/", (req, res) => res.send("Bienvenue sur l'api"));

// REGISTER

// -------------------- AUTHENTIFICATE REQUEST ---------------------
routes.use(require("../middleware/auth.js"));

// Interact with mongodb
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

// Stripe
const stripe = require('stripe')('sk_test_51HuID2Loq0Tuxdi9IYWFKRZWcTzEEize0kXOCrdEmPw7pVs6r7BPVAOY1MP4H5YNByq7CGv8CODyjExaTjabcBuv00WePDPJuU');

routes.get('/stripe', (req, res) => {
    res.send('stripe')
})

routes.get('/subscription-checkout', async (req, res) => {
    const redirect_url = req.query.redirect_url || (`https://${req.hostname}${req.originalUrl}`)
    const price = req.query.price || 'price_1Or7VELoq0Tuxdi9J7MUe3tf'
    console.log(redirect_url);
    const session = await stripe.checkout.sessions.create({
        line_items: [
        {
            // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
            price,
            quantity: 1,
        },
        ],
        mode: 'subscription',
        success_url: `https://api.tom-zapico.com/success?redirect_url=${redirect_url}`,
        cancel_url: redirect_url,
    });

    res.redirect(303, session.url);
});

// Appointments
// routes.use("/appointments", require("./appointments.js"));

// Schemas
// routes.use("/schemas", require("./schemas.js"));

// Automnations
// routes.use("/automnations", require("./automnations.js"));

// Contacts
routes.use("/contacts", require("./contacts.js"));

module.exports = routes;
