const express = require("express");
const router = express.Router();
const mongo = require("../db/mongo.js");

router.get('/', async (req, res) => {
    return await mongo({
        db: "storages",
        collection: "appointments",
        limit: 500
    })
})

router.get('/schedule', async (req, res) => {
    // const appointments = await mongo({
    //     db: "storages",
    //     collection: "appointments",
    //     limit: 500
    // })
    const appointments = await req.api.google.spreadsheet.get('1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw', "ENTRETIENS", req.oauth2Client)
    console.log(appointments.length);
    console.log('----------');
    // console.log('----------');
    const dateNow = new Date()

    console.log(appointments[0]);

    for (const appointment of appointments) {
        console.log("appointment ", appointments.indexOf(appointment));
        
        if (!appointment.DATE || appointment.DATE === '' || !appointment.HOUR || appointment.HOUR === '')  {
            console.log('no date');
            continue
        }

        const parts = appointment.DATE.split('/');
        const hour = appointment.HOUR.split(/[a-zA-Z\:]/gi)[0]
        const minute = appointment.HOUR.split(/[a-zA-Z\:]/gi)[1]

        const appointmentDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T${hour}:${minute}`)
        // console.log(appointmentDate);

        if (dateNow < appointmentDate) {
            console.log('coming');

            if (appointment.APPLIER === "") {
                console.log("no applier");
                if (appointmentDate - dateNow < 86400000) {
                    console.log('needs to be delete');
                }
                continue
            }
            
            if (appointment.STATUS === "Programmé" || !appointment.STATUS) {
                console.log('already scheduled');
                continue
            }
            
            console.log('---> schedule');
            console.log(appointment.APPLIER);
            console.log(appointment);
            // console.log('appointmentDate', appointmentDate.toISOString());
            const endAppointmentDate = new Date(appointmentDate)
            endAppointmentDate.setMinutes(endAppointmentDate.getMinutes() + 30);
            // console.log("endAppointmentDate", endAppointmentDate);

            const event = {
                summary: `Recrutement Alternance | ${appointment.JOB} | ${appointment.COMPANY}`,
                location: '',
                description: '',
                colorId: '8',
                start: {
                  dateTime: appointmentDate.toISOString(),
                  timeZone: 'Europe/Paris',
                },
                end: {
                  dateTime: endAppointmentDate.toISOString(),
                  timeZone: 'Europe/Paris',
                },
                attendees: [
                  { email: req.user.email },
                ],
                // attachments: [
                //   {
                //     fileId: 'ID du fichier Google Drive',
                //     title: 'Titre du fichier',
                //   },
                // ],
                // conferenceData: {
                //   createRequest: {
                //     requestId: '7qxalsvy0e',
                //     conferenceSolutionKey: {
                //       type: 'hangoutsMeet',
                //     },
                //   },
                // },
              }

            // console.log(event);
            // const scheduling = await req.api.google.calendar.event.create(event, req.oauth2Client)
            // console.log(scheduling);

            // break

        } else {
            // console.log('passed');
        }

    }

    res.json({
        ok: true
    })

    // appointmentsToSchedule = await appointments.filter(a => {
        
    // })
})

// ----------------------- IMPORT ---------------------

// SPREADSHEET
router.get('/import/spreadsheet/:id', async (req, res) => {
    const data = await req.api.google.spreadsheet.get(req.params.id, req.query.sheetname || "Feuille 1", req.oauth2Client);
    for (const item of data) {
        const posting = await mongo({
            db: "storages",
            collection: "appointments",
            action: "post",
            selector: item
        })
        console.log(posting);
    }
})

module.exports = router