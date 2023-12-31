const express = require("express");
const router = express.Router();

// const accountSid = "AC9e789ee5312a48308766a65b3fd0b965";
// const authToken = "dc47eb08a2ed3394a3ca6d3eefb77a79";
// const client = require("twilio")(accountSid, authToken);
const from = "Tom ZAPICO";
const to = "+3365774180";

// const rappel_entretien_embauche =
//   "Rappel : Entretien d'embauche aujourd'hui" +
//   "\n\n" +
//   `N'oubliez pas votre entretien d'embauche aujourd'hui à {HEURE} pour un poste de {POSTE} en alternance dans l'entreprise {ENTREPRISE} avec {RECRUTEUR}
//   Vous avez reçu les infos par mail.` +
//   "\n\n" +
//   `Tenez moi au courant à la suite de votre entretien.
//   Si vous n'avez pas de retour sous quelques jours, vous pouvez le relancer par mail.` +
//   "\n\n" +
//   "Je vous souhaite bon courage !" +
//   "\n\n" +
//   `Tom ZAPICO
//   Chargé de placement`;

// client.messages
//   .create({
//     body: rappel_entretien_embauche,
//     from,
//     to: "+33665774180",
//   })
//   .then((message) => console.log(message.sid));
// // .done();

const ovh = require("ovh")({
  endpoint: "ovh-eu", // Choisissez votre région (ovh-eu, ovh-ca, ovh-us, ...)
  appKey: "zaptom.pro@gmail.com",
  appSecret: "YOUR_APP_SECRET",
  consumerKey: "YOUR_CONSUMER_KEY",
});

// Exemple pour récupérer les informations sur votre compte OVH Telecom
ovh.request("GET", "/me", function (err, me) {
  if (err) {
    console.log(err, err.message);
  } else {
    console.log("Bonjour", me.firstname);
  }
});

// Exemple pour envoyer un SMS
let smsServiceName = "YOUR_SMS_SERVICE_NAME"; // Vous devez remplacer ceci par le nom de service réel fourni par OVH.

ovh.request(
  "POST",
  `/sms/${smsServiceName}/jobs`,
  {
    message: "Votre message texte ici",
    senderForResponse: true, // mettre à false si vous avez un nom d'expéditeur défini
    recipients: [to], // remplacez par le numéro de téléphone réel du destinataire
  },
  function (err, result) {
    if (err) {
      console.log(err, err.message);
    } else {
      console.log("SMS envoyé avec succès !", result);
    }
  }
);

router.post("/send", (req, res) => {});

module.exports = router;
