<<<<<<< HEAD
const express = require("express");
const router = express.Router();
const mongo = require("../db/mongo.js");

// Get appointments
router.get('/', async (req, res) => {
    return await mongo({
        db: "storages",
        collection: "appointments",
        limit: 500
    })
})

// Create an appointment
router.post('/', (req, res) => {

})

// function extract_file_id(url="") {
//     if (url.includes('/open?')) {
//         const match = url.match(/[?&]id=([^&]+)/);
//         return match && match[1];
//     } else if (url.includes('/files/d/') || url.includes('/document/d/')) {
//         return url.split('/')[5]
//     }
// }

router.get('/schedule', async (req, res) => {
    // const appointments = await mongo({
    //     db: "storages",
    //     collection: "appointments",
    //     limit: 500
    // })
    var event_scheduled_count = 0
    var event_missing_applier_count = 0
    var event_passed_count = 0
    var event_count = 0
    const appointments = await req.api.google.spreadsheet.get('1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw', "ENTRETIENS", req.google.sheets)
    console.log(appointments.length, " appointments");
    event_count = appointments.length
    // console.log('----------');
    const dateNow = new Date()
    
    console.log('----------');
    // console.log(appointments[0]);

    for (const appointment of appointments) {
        console.log('----------');
        // console.log("appointment ", appointments.indexOf(appointment));
        
        if (!appointment.DATE || appointment.DATE === '' || !appointment.HOUR || appointment.HOUR === '')  {
            // console.log('no date');
            continue
        }

        const parts = appointment.DATE.split('/');
        const hour = appointment.HOUR.split(/[a-zA-Z\:]{1,}/gi)[0]
        const minute = appointment.HOUR.split(/[a-zA-Z\:]{1,}/gi)[1] || "00"
        const appointmentDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${hour}:${minute}`)
        // console.log(appointmentDate.toString());

        if (dateNow < appointmentDate) {
            // console.log("dateNow < appointmentDate");
            const iAppointment = appointments.indexOf(appointment)
            console.log("appointment ", iAppointment);
            console.log('coming');

            if (appointment.APPLIER === "" || !appointment.APPLIER) {
                console.log("no applier");
                if (appointmentDate - dateNow < 86400000) {
                    console.log('needs to be delete');
                }
                continue
            }
            
            if (appointment.STATUS && appointment.STATUS !== "") {
                console.log('already scheduled');
                continue
            }
            
            console.log('---> schedule');
            console.log(appointment.COMPANY, appointment.DATE, appointment.HOUR);
            const endAppointmentDate = new Date(appointmentDate)
            endAppointmentDate.setMinutes(endAppointmentDate.getMinutes() + 30);

            var event = {
                calendarId: 'efd050e54fc6a11e8d0d4db0be3f87913edc8e466f507bef01360423e622aedf@group.calendar.google.com',
                requestBody: {
                    summary: `Recrutement Alternance | ${appointment.JOB} | ${appointment.COMPANY}`,
                    location: appointment.LOCATION,
                    description: `Vous serez reçu par ${appointment.RECRUITER}.\n${appointment.PHONE}`,
                    start: {
                      dateTime: appointmentDate.toISOString(),
                      timeZone: 'Europe/Paris',
                    },
                    end: {
                      dateTime: endAppointmentDate.toISOString(),
                      timeZone: 'Europe/Paris',
                    },
                    attendees: [
                      { email: req.user.email, comment: "Chargé de recrutement" }
                    ]
                  },
                sendUpdates: 'all',
                supportsAttachments: true,
                reminders: {
                    useDefault: false,
                    overrides: [
                      { method: 'email', minutes: 24 * 60 }, // 24 heures avant l'événement
                      { method: 'popup', minutes: 30 }, // 30 minutes avant l'événement
                    ],
                  },
              }

              if (appointment.EMAIL && appointment.EMAIL !== "") {
                event.requestBody.attendees.push({email: appointment.EMAIL.replace(/(^[\s]{1,}|[\s\.]{1,}$)/, ""), displayName: appointment.RECRUITER, comment: "Recruteur"})
              }

              const appliers = await req.api.google.spreadsheet.get('1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw', "CANDIDATS", req.google.sheets)
              const applier = appliers.find(a => a.EMAIL === appointment.APPLIER)
              if (!applier) {
                  console.log('missing applier');
                  event_missing_applier_count++
                  continue
              }

              event.requestBody.attendees.push({email: applier.EMAIL.replace(/(^[\s]{1,}|[\s\.]{1,}$)/, ""), displayName: applier.NAME, comment: "Candidat"})
              
              event.requestBody.attachments = [
                {
                  fileUrl: applier.CV,
                  title: 'CV ' + applier.NAME,
                },
              ]

              if (appointment.VISIO && appointment.VISIO.toString().toLowerCase() === 'true') {
                event.conferenceDataVersion = 1
                event.requestBody.location = ""
                event.requestBody.description += "\n\nLe rendez-vous aura lieu en visioconférence"
                event.requestBody.conferenceData = {
                    createRequest: {
                      requestId: '7qxalsvy0e',
                      conferenceSolutionKey: {
                        type: 'hangoutsMeet',
                      },
                    },
                  }
              } else {
                event.requestBody.description += "\n\nLe rendez-vous aura lieu en présentiel"
              }
              
              // console.log(event);
              var scheduling = await req.google.calendar.events.insert(event)
              var event = await scheduling.data
            //   console.log(event);
              console.log("appointment scheduled !");

              const range = "ENTRETIENS!V" + (iAppointment+2)
              try {
                const response = await req.google.sheets.spreadsheets.values.update({
                  spreadsheetId: "1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw",
                  range,
                  valueInputOption: 'RAW',
                  requestBody: {
                    values: [["Programmé"]],
                  },
                });
                console.log('Cell value updated:', response.data.updatedRange);
              } catch (err) {
                console.error('Error updating cell value:', err);
              }



            event_scheduled_count++

            // break

        } else {
            event_passed_count++
        }

    }

    res.json({
        ok: true,
        event_count,
        event_passed_count,
        event_missing_applier_count,
        event_scheduled_count,
    })
})

// ----------------------- IMPORT ---------------------

// SPREADSHEET
router.post('/import/spreadsheet/:id/:sheetname', async (req, res) => {
    const data = await req.api.google.spreadsheet.get(req.params.id, req.params.sheetname, req.oauth2Client);
    const mapping = await req.body.mapping
    const appointments = await data.mapping(el => {
        for (const field in el) {
            if (mapping[field]) {
                el
            } else {
                delete el[field]
            }
        }
        return el
    })
    for (var appointment of appointments) {
        appointment = await req.api.tools.clear_item(appointment)
        const itemExist = await req.api.tools.itemExist({
            db: 'storages',
            collection: "appointments",
            selector: {
                PHONE: appointment.COMPANY.PHONE,
                DATE: appointment.DATE
            }
        })
        if (itemExist.ok === true) {
            appointment = itemExist.item
            const putting = await mongo({
                db: "storages",
                collection: "appointments",
                action: "post",
                selector: [{_id: appointment._id}],
                updator: {$set: appointment}
            })
        } else {
            const posting = await mongo({
                db: "storages",
                collection: "appointments",
                action: "post",
                selector: appointment
            })
            console.log(posting);
        }
    }
    res.json({
        ok: true
    })
})
router.get('/export/spreadsheet/:id', async (req, res) => {
    
})

=======
const express = require("express");
const router = express.Router();
const mongo = require("../db/mongo.js");

// Get appointments
router.get('/', async (req, res) => {
    return await mongo({
        db: "storages",
        collection: "appointments",
        limit: 500
    })
})

// Create an appointment
router.post('/', (req, res) => {

})

// function extract_file_id(url="") {
//     if (url.includes('/open?')) {
//         const match = url.match(/[?&]id=([^&]+)/);
//         return match && match[1];
//     } else if (url.includes('/files/d/') || url.includes('/document/d/')) {
//         return url.split('/')[5]
//     }
// }

router.get('/schedule', async (req, res) => {
    // const appointments = await mongo({
    //     db: "storages",
    //     collection: "appointments",
    //     limit: 500
    // })
    var event_scheduled_count = 0
    var event_missing_applier_count = 0
    var event_passed_count = 0
    var event_count = 0
    const appointments = await req.api.google.spreadsheet.get('1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw', "ENTRETIENS", req.google.sheets)
    console.log(appointments.length, " appointments");
    event_count = appointments.length
    // console.log('----------');
    const dateNow = new Date()
    
    console.log('----------');
    // console.log(appointments[0]);

    for (const appointment of appointments) {
        console.log('----------');
        // console.log("appointment ", appointments.indexOf(appointment));
        
        if (!appointment.DATE || appointment.DATE === '' || !appointment.HOUR || appointment.HOUR === '')  {
            // console.log('no date');
            continue
        }

        const parts = appointment.DATE.split('/');
        const hour = appointment.HOUR.split(/[a-zA-Z\:]{1,}/gi)[0]
        const minute = appointment.HOUR.split(/[a-zA-Z\:]{1,}/gi)[1] || "00"
        const appointmentDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${hour}:${minute}`)
        // console.log(appointmentDate.toString());

        if (dateNow < appointmentDate) {
            // console.log("dateNow < appointmentDate");
            const iAppointment = appointments.indexOf(appointment)
            console.log("appointment ", iAppointment);
            console.log('coming');

            if (appointment.APPLIER === "" || !appointment.APPLIER) {
                console.log("no applier");
                if (appointmentDate - dateNow < 86400000) {
                    console.log('needs to be delete');
                }
                continue
            }
            
            if (appointment.STATUS && appointment.STATUS !== "") {
                console.log('already scheduled');
                continue
            }
            
            console.log('---> schedule');
            console.log(appointment.COMPANY, appointment.DATE, appointment.HOUR);
            const endAppointmentDate = new Date(appointmentDate)
            endAppointmentDate.setMinutes(endAppointmentDate.getMinutes() + 30);

            var event = {
                calendarId: 'efd050e54fc6a11e8d0d4db0be3f87913edc8e466f507bef01360423e622aedf@group.calendar.google.com',
                requestBody: {
                    summary: `Recrutement Alternance | ${appointment.JOB} | ${appointment.COMPANY}`,
                    location: appointment.LOCATION,
                    description: `Vous serez reçu par ${appointment.RECRUITER}.\n${appointment.PHONE}`,
                    start: {
                      dateTime: appointmentDate.toISOString(),
                      timeZone: 'Europe/Paris',
                    },
                    end: {
                      dateTime: endAppointmentDate.toISOString(),
                      timeZone: 'Europe/Paris',
                    },
                    attendees: [
                      { email: req.user.email, comment: "Chargé de recrutement" }
                    ]
                  },
                sendUpdates: 'all',
                supportsAttachments: true,
                reminders: {
                    useDefault: false,
                    overrides: [
                      { method: 'email', minutes: 24 * 60 }, // 24 heures avant l'événement
                      { method: 'popup', minutes: 30 }, // 30 minutes avant l'événement
                    ],
                  },
              }

              if (appointment.EMAIL && appointment.EMAIL !== "") {
                event.requestBody.attendees.push({email: appointment.EMAIL.replace(/(^[\s]{1,}|[\s\.]{1,}$)/, ""), displayName: appointment.RECRUITER, comment: "Recruteur"})
              }

              const appliers = await req.api.google.spreadsheet.get('1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw', "CANDIDATS", req.google.sheets)
              const applier = appliers.find(a => a.EMAIL === appointment.APPLIER)
              if (!applier) {
                  console.log('missing applier');
                  event_missing_applier_count++
                  continue
              }

              event.requestBody.attendees.push({email: applier.EMAIL.replace(/(^[\s]{1,}|[\s\.]{1,}$)/, ""), displayName: applier.NAME, comment: "Candidat"})
              
              event.requestBody.attachments = [
                {
                  fileUrl: applier.CV,
                  title: 'CV ' + applier.NAME,
                },
              ]

              if (appointment.VISIO && appointment.VISIO.toString().toLowerCase() === 'true') {
                event.conferenceDataVersion = 1
                event.requestBody.location = ""
                event.requestBody.description += "\n\nLe rendez-vous aura lieu en visioconférence"
                event.requestBody.conferenceData = {
                    createRequest: {
                      requestId: '7qxalsvy0e',
                      conferenceSolutionKey: {
                        type: 'hangoutsMeet',
                      },
                    },
                  }
              } else {
                event.requestBody.description += "\n\nLe rendez-vous aura lieu en présentiel"
              }
              
              // console.log(event);
              var scheduling = await req.google.calendar.events.insert(event)
              var event = await scheduling.data
            //   console.log(event);
              console.log("appointment scheduled !");

              const range = "ENTRETIENS!V" + (iAppointment+2)
              try {
                const response = await req.google.sheets.spreadsheets.values.update({
                  spreadsheetId: "1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw",
                  range,
                  valueInputOption: 'RAW',
                  requestBody: {
                    values: [["Programmé"]],
                  },
                });
                console.log('Cell value updated:', response.data.updatedRange);
              } catch (err) {
                console.error('Error updating cell value:', err);
              }



            event_scheduled_count++

            // break

        } else {
            event_passed_count++
        }

    }

    res.json({
        ok: true,
        event_count,
        event_passed_count,
        event_missing_applier_count,
        event_scheduled_count,
    })
})

// ----------------------- IMPORT ---------------------

// SPREADSHEET
router.post('/import/spreadsheet/:id/:sheetname', async (req, res) => {
    const data = await req.api.google.spreadsheet.get(req.params.id, req.params.sheetname, req.oauth2Client);
    const mapping = await req.body.mapping
    const appointments = await data.mapping(el => {
        for (const field in el) {
            if (mapping[field]) {
                el
            } else {
                delete el[field]
            }
        }
        return el
    })
    for (var appointment of appointments) {
        appointment = await req.api.tools.clear_item(appointment)
        const itemExist = await req.api.tools.itemExist({
            db: 'storages',
            collection: "appointments",
            selector: {
                PHONE: appointment.COMPANY.PHONE,
                DATE: appointment.DATE
            }
        })
        if (itemExist.ok === true) {
            appointment = itemExist.item
            const putting = await mongo({
                db: "storages",
                collection: "appointments",
                action: "post",
                selector: [{_id: appointment._id}],
                updator: {$set: appointment}
            })
        } else {
            const posting = await mongo({
                db: "storages",
                collection: "appointments",
                action: "post",
                selector: appointment
            })
            console.log(posting);
        }
    }
    res.json({
        ok: true
    })
})
router.get('/export/spreadsheet/:id', async (req, res) => {
    
})

>>>>>>> 5770a63350dfc2424d8e7dcafc9aef4a446ce7a5
module.exports = router