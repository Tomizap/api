const express = require("express");
const router = express.Router();
const {mongo} = require("@tomizap/tools");

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
    // const appointments = await req.api.google.spreadsheet.get('1ru8WO_rx1eV9x5S6I49RfJJdCpeVPkF8WAatVjhEDAw', "ENTRETIENS", req.google.sheets)
    // console.log(appointments.length, " appointments");
    const data = await req.api.appointments.schedule(appointments)
    res.json({
        ok: true,
        data
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

module.exports = router