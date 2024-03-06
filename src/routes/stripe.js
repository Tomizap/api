const express = require("express");
const mongo = require("../db/mongo");
const router = express.Router();

const stripe = require('stripe')('sk_test_51HuID2Loq0Tuxdi9IYWFKRZWcTzEEize0kXOCrdEmPw7pVs6r7BPVAOY1MP4H5YNByq7CGv8CODyjExaTjabcBuv00WePDPJuU');

router.get('/create-checkout-session', async (req, res) => {
    const session = await stripe.checkout.sessions.create({
        line_items: [
        {
            // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
            price: req.query.price || 'price_1Or7VELoq0Tuxdi9J7MUe3tf',
            quantity: 1,
        },
        ],
        mode: 'subscription',
        success_url: `${YOUR_DOMAIN}/success.html?redirect_url=${req.query.redirect_url || req.originalUrl}`,
        cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    });

    res.redirect(303, session.url);
});

// This is your Stripe CLI webhook secret for testing your endpoint locally.
// const endpointSecret = "whsec_dkGLqmpk1l3SE9Tbq65Ju6cRDH6svswk";

router.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
    const sig = request.headers['stripe-signature'];
  
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, "whsec_dkGLqmpk1l3SE9Tbq65Ju6cRDH6svswk");
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const checkoutSessionCompleted = event.data.object;
        console.log('checkoutSessionCompleted', checkoutSessionCompleted);
        // Then define and call a function to handle the event checkout.session.completed
        break;
      case 'customer.subscription.deleted':
        const customerSubscriptionDeleted = event.data.object;
        console.log('customerSubscriptionDeleted', customerSubscriptionDeleted);
        // Then define and call a function to handle the event customer.subscription.deleted
        break;
      case 'customer.subscription.updated':
        const customerSubscriptionUpdated = event.data.object;
        console.log('customerSubscriptionUpdated', customerSubscriptionUpdated);
        // Then define and call a function to handle the event customer.subscription.updated
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  
    // Return a 200 response to acknowledge receipt of the event
    response.send();
  });

module.exports = router