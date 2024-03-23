const express = require("express");
// const mongo = require("../db/mongo");
const router = express.Router();
// const stripe = require('stripe')('sk_test_51HuID2Loq0Tuxdi9IYWFKRZWcTzEEize0kXOCrdEmPw7pVs6r7BPVAOY1MP4H5YNByq7CGv8CODyjExaTjabcBuv00WePDPJuU');

router.use(async (req, res, next) => {
    // return res.send(req.user.auth.stripe.token)
    req.stripe = await require('stripe')(req.query.stripe_api || req.user.auth.stripe.token);
    req.user.stripe.customers = await req.stripe.customers.list({
        limit: req.query.limit || 99,
        email: req.user.email
        }).then(customers => customers.data)
    // return res.json(req.user.stripe.subscriptions)
    next()
})

router.get('/me', (req, res) => {res.json({ok:true, data: req.user.stripe.customers})})

router.post('/invit-customer', async (req, res) => {
    customer_email = req.body.customer_email
    pay_link = "https://buy.stripe.com/test_eVa3eheX008b9Da288"
    const emailing = await req.api.post('/google/gmail/send', {
        to: customer_email,
        subject: "Démarrer l'aventure avec LDeclic !",
        html: `<p>Bonjour,</p><p>nous sommes ravi de votre confiance pour le développement de votre stratégie digital.</p><p>Veuillez vous rendre sur ce lien : <a href="${pay_link}">${pay_link}</a> pour valider commande. Vous recevrez par la suite les instructions pour vous connecter à votre compte client.</p><p>Cordialement</p><p><b>Tom ZAPICO</b><br>06 65 77 41 80</p>`,
    })
    res.json(emailing)
})

router.get('/:type', async (req, res) => {
    res.json(await req.stripe[req.params.type].list({
        limit: req.query.limit || 99,
      }))
})

router.get('/me/:type', async (req, res) => {
    res.json(await req.stripe[req.params.type].list({
        limit: req.query.limit || 99,
        customer: req.user.stripe.customers[0].id
    }).then(r => r.data))
})
router.post('/me/:type', async (req, res) => {
    res.json(await req.stripe[req.params.type].create(req.body))
})
router.post('/me/:type/:subtype', async (req, res) => {
    res.json(await req.stripe[req.params.type][req.params.subtype].create(req.body))
})
router.get('/me/subscriptions/:status', async (req, res) => {
    res.json(await req.stripe.subscriptions.list({
        limit: req.query.limit || 99,
        customer: req.user.stripe.customers[0].id,
        status: req.params.status
    }).then(r => r.data))
})
router.use('/me/subscriptions/:id', async (req, res) => {
    req.stripe.subscription = await stripe.subscriptions.retrieve(req.params.id);
})
router.get('/me/subscriptions/:id/pay', async (req, res) => {
    const redirect_url = req.query.redirect_url || (`${req.protocol}://${req.hostname}${req.originalUrl}`)
    // const price = req.stripe.subscription.plan.id
    console.log(redirect_url);
    const session = await stripe.checkout.sessions.create({
        line_items: [
        {
            // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
            price: req.stripe.subscription.plan.id,
            quantity: 1,
        },
        ],
        mode: 'subscription',
        success_url: redirect_url,
        cancel_url: redirect_url,
        customer_email: req.user.email
    });
    res.redirect(303, session.url);
})


module.exports = router