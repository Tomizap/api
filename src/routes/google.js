const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

// ------------------------------- DRIVE --------------------------

// GET FILES
router.get('/drive/get/file/:id', (req, res) => {
  
})

// ------------------------------- SPREADSHEET --------------------------

// GET GOOGLE SPREADSHEET
router.get('/spreadsheet/:id/:sheetname', async (req, res) => {
  const data = await req.api.google.spreadsheet.get(req.params.id, req.params.sheetname, req.google.sheets);
  res.json(data)
})

// RICH CONTACTS
router.get('/spreadsheet/:id/:sheetname/rich', async (req, res) => {
  const data = await req.api.google.spreadsheet.get(req.params.id, req.params.sheetname, req.google.sheets);
  const columns = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"]
  const fields = Object.keys(data[0])
  const columMapping = {}
  for (const field of fields) {
    columMapping[field] = columns[fields.indexOf(field)]
  }
  for await (var item of data) {
    console.log('item', data.indexOf(item));
    const rowIndex = data.indexOf(item)+2
    console.log(rowIndex);
    const itemStringified = JSON.stringify(item)
    item = await req.api.contacts.rich(item)
    if (JSON.stringify(item) === itemStringified) {
      console.log('no changes');
      continue
    } 
    // console.log("itemStringified", itemStringified);
    // console.log("item", item);
    const range = req.params.sheetname + "!A" + (rowIndex)
    try {
      await req.google.sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_FILE_BDD_ID,
        range,
        valueInputOption: 'RAW',
        requestBody: {
          values: [Object.values(item)],
        },
      });
      console.log(`row ${rowIndex} updated !`);
    } catch (error) {
      console.log(error);
      continue
    }
    // break
  }
  res.json(data)
})

// ------------------------------- GMAIL --------------------------

// SEND GMAIL
router.post('/gmail/send', async (req, res) => {
  return res.json(await req.api.google.gmail.message.send(await req.body, req.google.gmail))
  // const transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     type: "OAuth2",
  //     user: req.user.email,
  //     clientId: GOOGLE_CLIENT_ID,
  //     clientSecret: GOOGLE_CLIENT_SECRET,
  //     refreshToken: req.user.auth.google.refresh_token,
  //   },
  // });
  // const mailOptions = {
  //   from: `Tom ZAPICO <${req.user.email}>`,
  //   to: req.body.to || "zaptom.pro@gmail.com",
  //   subject: req.body.subject || "Service d'accompagnement gratuit pour recrutement en alternance",
  //   html: req.body.html || "",
  //   text: req.body.text || "",
  //   attachments: req.body.attachments || [],
  // };
  // const emailing = await transporter.sendMail(mailOptions)
  // res.json({
  //     ok: true,
  //     message: "email sent successfully to " + mailOptions.to,
  //     data: emailing
  // });
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

module.exports = router