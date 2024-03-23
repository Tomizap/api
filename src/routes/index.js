const express = require("express");
const routes = express.Router();
const mongo = require("../db/mongo.js");
const stripe = require('stripe')('sk_test_51HuID2Loq0Tuxdi9IYWFKRZWcTzEEize0kXOCrdEmPw7pVs6r7BPVAOY1MP4H5YNByq7CGv8CODyjExaTjabcBuv00WePDPJuU');

// ----------------------- HOME----------------------- 
routes.get("/", (req, res) => res.send("Bienvenue sur l'api"));

// ----------------------- REGISTER----------------------- 

// ----------------------- STRIPE --------------------------
routes.post('/stripe/webhook', express.raw({type: 'application/json'}), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, "whsec_dkGLqmpk1l3SE9Tbq65Ju6cRDH6svswk");
  } catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  console.log('event.data.object', event.data.object);

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSessionCompleted = event.data.object;
      break;
    case 'customer.subscription.deleted':
      const customerSubscriptionDeleted = event.data.object;
      // Then define and call a function to handle the event customer.subscription.deleted
      break;
    case 'customer.subscription.updated':
      const customerSubscriptionUpdated = event.data.object;
      // Then define and call a function to handle the event customer.subscription.updated
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});
routes.get('/stripe/subscriptions/checkout', async (req, res) => {
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
        success_url: redirect_url,
        cancel_url: redirect_url,
        customer_email: req.query.customer_email
    });

    res.redirect(303, session.url);
});

// ------------------------------------------------------------------------------------------
// -------------------------------- AUTHENTIFICATE REQUEST ----------------------------------
// ------------------------------------------------------------------------------------------
routes.use(require("../middleware/auth.js"));

// GET USER
routes.get(["/me", '/auth'], (req, res) => {
  res.json({
    ok: true,
    message: 'authentifaction réussie !',
    user: req.user,
  });
});

// ----------------------- Interact with db --------------------------

// Request
// routes.post("/", async (req, res) => {
//   // console.log(req.body);
//   req.response.data = await mongo(req.body);
//   // console.log(req.response.data);
//   req.response.ok = 
//     !req.response.data || 
//     req.response.data.acknowledged || 
//     req.response.data.length > 0 ? true : false;
//   req.response.message = req.response.ok || req.response.data.acknowledged ? 
//     "operation success" : 
//     "operation fail";
//   req.response.config = req.body
//   return res.json(req.response);
// });

// req.use("/:db/:collection/", (req, res, next) => {

// })

// // GET
// routes.post("/:db/:collection/", async (req, res) => {
//   // console.log(req.body);
//   return res.json(await mongo({
//     db: req.params.db,
//     collection: req.params.collection
//   }));
// });

// // PUT
// routes.put("/:db/:collection/", async (req, res) => {
//   // console.log(req.body);
//   var item = await req.body
//   const itemExist = req.api.itemExist({
//     db: req.params.db,
//     collection: req.params.collection,
//     selector: {
//       $or: [
//         {PHONE: contact.PHONE},
//         {NAME: contact.NAME, LOCATION: contact.LOCATION}
//       ]
//     }
//   })
//   if (itemExist.ok === true) {
//     item = itemExist.data
//     const putting = await mongo({
//       db: req.params.db,
//       collection: req.params.collection,
//       action: "edit",
//       selector: {_id: item._id}
//       updator: item
//     })
//     return res.json({
//       ok: true,
//       data: item,
//       message: `${req.params.collection} has been modified.`
//     });
//   } else {
//     return res.json({
//       ok: true,
//       data: item,
//       message: `${req.params.collection} has been modified.`
//     });

//   }
// });

// POST

// DELETE

// ----------------------- OAuth --------------------------
routes.use("/oauth", require("./oauth.js"));

// ----------------------- Google --------------------------
routes.use("/google", require("./google.js"));

// ----------------------- Emailing --------------------------
routes.use("/email", require("./email.js"));

// ----------------------- Download file from data --------------------------
routes.use("/download", require("./downloads.js"));

// ----------------------- Stripe --------------------------
routes.use("/stripe", require("./stripe.js"));

// ----------------------- Appointments --------------------------
routes.use("/storages/appointments", require("./appointments.js"));

// ----------------------- recruit --------------------------
routes.use("/recruit", require("./recruit.js"));

// ----------------------- Schemas --------------------------
// routes.use("/schemas", require("./schemas.js"));

// ----------------------- Automnations --------------------------
// routes.use("/automnations", require("./automnations.js"));

// ----------------------- Contacts --------------------------
routes.use("/contacts", require("./contacts.js"));

module.exports = routes;
