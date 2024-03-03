const express = require("express");
const router = express.Router();

const { google } = require("googleapis");
const nodemailer = require("nodemailer");

// GOOGLE_CLIENT_ID = "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com";
// GOOGLE_CLIENT_SECRET = "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";

// router.use(async (req, res, next) => {
//   req.oauth2Client = new google.auth.OAuth2(
//     GOOGLE_CLIENT_ID,
//     GOOGLE_CLIENT_SECRET
//   );
//   await req.oauth2Client.setCredentials({
//     refresh_token: req.user.auth.google.refresh_token,
//   });
//   next()
// })

// ------------------------------- DRIVE --------------------------

// GET FILES
router.get('/drive/get/file/:id', (req, res) => {
  
})

// ------------------------------- SPREADSHEET --------------------------

// GET GOOGLE SPREADSHEET
router.get('/spreadsheet/:id', async (req, res) => {
  const data = await req.api.google.spreadsheet.get(req.params.id, req.query.sheetname || "Feuille 1", req.oauth2Client);
  res.json(data)
})

// ------------------------------- GMAIL --------------------------

// SEND GMAIL
router.get('/gmail/send', async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: req.user.email,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: req.user.auth.google.refresh_token,
      // accessToken: accessToken.token,
    },
  });
  
  const mailOptions = {
    from: `Expéditeur <${req.user.email}>`,
    to: req.body.to || "zaptom.pro@gmail.com",
    subject: req.body.subject || "Sujet",
    html: req.body.html || "N'oublie jamais",
    text: req.body.text || "Contenu de l'e-mail en texte",
  };
  
  res.json(await transporter.sendMail(mailOptions));
})

// SYNC SPREADSHEET WITH GOOGLE CONTACTS
async function syncSpreadSheetWithGoogleContacts(spreadsheetId, sheetName, mapping, auth) {
  const data = await getSpreadsheetData(spreadsheetId, sheetName, auth)
  const contacts = [] 
  await data.forEach(contact => {
    contacts.push({
      names: [{ givenName: contact[mapping.givenName], familyName: contact[mapping.familyName] }],
      emailAddresses: [{ value: contact[mapping.emailAddresses] }],
      phoneNumbers: [{ value: contact[mapping.phoneNumbers] }],
      addresses: [{ streetAddress: contact[mapping.addresses] }],
    })
  }) 
  return await createContacts(contacts, auth)
}
router.get('/spreadsheet/:id/syncGoogleContacts', async (req, res) => {
  res.json(await syncSpreadSheetWithGoogleContacts(req.params.id, req.query.sheetname || 'Feuille 1', {
    givenName: "PRENOM",
    familyName: "NOM",
    phoneNumbers: 'TELEPHONE',
    emailAddresses: 'MAIL'
  }, req.oauth2Client))
})

// ------------------------------- CALENDAR --------------------------

// CREATE GOOGLE CALENDAR EVENT
router.post('/calendar/event', async (req, res) => {
  const event = {
    summary: 'Recrutement Alternance | POSTE | ENTREPRISE',
    location: '',
    description: '',
    colorId: '8',
    start: {
      dateTime: '2024-02-19T09:00:00',
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: '2024-02-19T10:00:00',
      timeZone: 'Europe/Paris',
    },
    // attendees: [
    //   { email: 'Adresse e-mail du contact' },
    // ],
    // attachments: [
    //   {
    //     fileId: 'ID du fichier Google Drive',
    //     title: 'Titre du fichier',
    //   },
    // ],
    conferenceData: {
      createRequest: {
        requestId: '7qxalsvy0e',
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    },
  };
  res.json(await req.api.google.calendar.event.create(event, req.oauth2Client))
})

// ------------------------------- PEOPLE --------------------------

// CREATE GOOGLE CONTACTS
router.post('/people', async (req, res) => {
  res.json(await req.api.google.contacts.create(req.body.contacts, req.oauth2Client))
})

// ------------ CREATE GOOGLE SPREADSHEET -------------
// async function createSpreadsheet(sheets, title) {
//   const response = await sheets.spreadsheets.create({
//     resource: {
//       properties: {
//         title: title,
//       },
//     },
//   });
//   return response.data.spreadsheetId;
// }
// async function writeToSpreadsheet(sheets, spreadsheetId, data) {
//   let values = data.map((obj) => Object.values(obj));
//   values.unshift(Object.keys(data[0]));

//   await sheets.spreadsheets.values.update({
//     spreadsheetId: spreadsheetId,
//     range: "A1", // Commence à la première cellule
//     valueInputOption: "USER_ENTERED",
//     resource: {
//       values: values,
//     },
//   });
// }
// router.get("/:type/GoogleSpreadSheet", async (req, res) => {
//   const oauth2Client = new google.auth.OAuth2(
//     GOOGLE_CLIENT_ID,
//     GOOGLE_CLIENT_SECRET
//   );
//   oauth2Client.setCredentials({
//     refresh_token: req.user.auth.google.refresh_token,
//   });
//   const sheets = google.sheets({ version: "v4", auth: oauth2Client });

//   const fileName =
//     // req.automnation.name.replace(/[\/:*?"<>|+\s]/gm, "_") +
//     // "_" +
//     new Date(Date.now()).toISOString().split("T")[0] +
//     "T" +
//     new Date(Date.now()).getHours() +
//     ":" +
//     new Date(Date.now()).getMinutes();

//   const spreadsheetId = await createSpreadsheet(sheets, fileName);
//   // const companies = await req.items
//   var companies = require("../../data/contacts.companies.json");
//   if (companies.length > 9999) companies = companies.slice(0, 100);
//   await writeToSpreadsheet(sheets, spreadsheetId, companies || [{}]);

//   // console.log(`Feuille de calcul créée avec l'ID : ${spreadsheetId}`);

//   res.redirect("https://docs.google.com/spreadsheets/d/" + spreadsheetId);
// });

module.exports = router