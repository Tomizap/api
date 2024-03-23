const { google } = require("googleapis");
const axios = require('axios')
const mongo = require('./db/mongo.js')
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const api = {
    tools: {
      get_schema: async function (type) {
        if (!type) {
          console.log('no type');
          return null
        }
        return await mongo({collection: 'schemas', selector: {type: type}})
          .then(s => s.length > 0 ? s[0] : null)
      },
      clear_items: async function (items=[]) {
        console.log('clear_items()');
        // console.log(schema);
        for (var item of items) {
          console.log('------------------');
          console.log('item ', items.indexOf(item)+1);
          // const _id = item._id
          const clearing = await api.tools.clear_item(item)
          item = clearing.item
        }
        return items
      },
      async clear_item(item={}) {
        console.log('clear_item()');

        var schema = await api.tools.get_schema(item._type)
        if (schema === null) {
          console.log('no schema for ' + item._type);
          return item
        } else {
          schema = schema.fields
        }
        
        const updator = {$set: {}, $unset: {}, $rename: {}, $push: {}}

        // alias mapping
        for (const field in item) { 
          if (schema[field.split('_')[0]]) {
            const theField = field.split('_')[0]
            const subField = field.split('_').splice(0, 1).join('_')
            if (!item[theField]) item[theField] = {}
            if (!updator.$set[theField]) item[theField] = {}
            item[theField][subField] = item[field]
            updator.$set[theField] = item[field]
            continue
          }
          const newField = field.replace(/^\w+_/, '')
          if (schema[newField] && item[field] !== '' && newField !== field) {
            console.log('alias mapping', field, '=>', newField);
            updator.$set[newField] = item[field]
            item[newField] = item[field]
            updator.$unset[field] = 1
          }
        }   
        // add missing property
        for (const field in schema) 
          if (!item.hasOwnProperty(field) && !['_id'].includes(field)) {
            console.log('add missing property', field);
            updator.$set[field] = ''
            item[field] = ''
          }
        // delete useless property
        for (const field in item) 
          if (!schema[field] && !['_id'].includes(field)) {
            console.log('delete field', field);
            updator.$unset[field] = 1
            delete item[field]
          } 
        // check fields
        for (const field in item) {
            const type = schema[field].type
            // console.log(await item);
            if (type === "user_access") {
              if (typeof item[field] === "string") {
                item[field] = ['zaptom.pro@gmail.com']
                updator.$set[field] = ['zaptom.pro@gmail.com']
              } else {
                if (!item[field].includes('zaptom.pro@gmail.com')) {
                  item[field].push('zaptom.pro@gmail.com')
                  updator.$push[field] = 'zaptom.pro@gmail.com'
                }
              }
            } else if (type === "uuid" && item[field] == "") {
              const uuid = uuidv4()
              item._uuid = uuid
              updator.$set._uuid = uuid
            } else if (type === "phone") {
              var newPhone = item[field]
                .replace(/[\-\.\s\t\n]/gi, '')
                .replace(/\+\d{1,2}/gi, '')
                .replace(/^00/, '')
              if (newPhone[0] !== '0') newPhone = '0' + newPhone
              if (newPhone !== item[field]) {
                item[field] = newPhone
                updator.$set[field] = item[field]
              }
            } else if (type === "array") {
              if (typeof item[field] !== "object") {
                item[field] = []
                updator.$set[field] = []
              }
            } else if (type === "select") {
              // const options = await mongo({})
            } else if (type === "boolean") {
              if (typeof item[field] !== 'boolean') {
                if (typeof item[field] !== 'string') {
                  if (["yes", 'true', "ok"].includes(item[field].toLowerCase())) {
                    item[field] = true
                    updator.$set[field] = true
                  } else {
                    item[field] = false
                    updator.$set[field] = false
                  }
                } else {
                  item[field] = false
                  updator.$set[field] = false
                }
              }
            } else if (type === "integer") {
              if (typeof item[field] !== 'integer') {
                item[field] = parseInt(item[field])
                updator.$set[field] = parseInt(item[field])
              }
            } else if (type === "email") {
              var newEmail = item[field].replace(/\.$/gi, '')
              if (newEmail !== item[field]) {
                item[field] = newEmail
                updator.$set[field] = item[field]
              }
            }
        }
        // // rich item
        // var POSTCODE = ""
        // var regex = /\d{5}/
        // if ((POSTCODE = regex.exec(item.LOCATION)) !== null) {
        //   POSTCODE = POSTCODE[0]
        //   console.log(POSTCODE);
        //   if (item.POSTCODE === "") {
        //     item.POSTCODE = POSTCODE
        //     updator.$set[POSTCODE] = POSTCODE
        //   }
        //   if (item.COUNTY === '') {
        //     const COUNTY = POSTCODE[0] + POSTCODE[1]
        //     item.POSTCODE = COUNTY
        //     updator.$set[COUNTY] = COUNTY
        //   }
        // }
        // if (item.POSTCODE !== "" && (item.CITY === "" || item.COUNTRY === "" || item.STATE === "")) {
        //   await axios(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${POSTCODE}&addressdetails=1&limit=1`).then(r => {
        //     if (r.length > 0) {
        //       if (item.STATE=== "") {
        //         item.STATE= r[0].address.state
        //         updator.$set.STATE= r[0].address.state
        //       }
        //       if (item.COUNTRY === "") {
        //         item.COUNTRY = r[0].address.country
        //         updator.$set.COUNTRY = r[0].address.country
        //       }
        //       if (item.CITY === "") {
        //         item.CITY = r[0].address.town
        //         updator.$set.CITY = r[0].address.town
        //       }
        //     }
        //   })
        // }

        // mongo update
        var update
        if (
          Object.keys(updator.$set).length > 0 ||
          Object.keys(updator.$unset).length > 0 ||
          Object.keys(updator.$push).length > 0 ||
          Object.keys(updator.$rename).length > 0
          ) {
            console.log(updator);
            update = await mongo({
              db: "contacts",
              collection: schema.type,
              action: 'edit',
              selector: { _id: item._id },
              updator
            })
              .then(result => console.log('updated'))
          } else {
            console.log('no update');
          }

        return {item, updator, update}
      },
      async itemExist(config={}) {
        const items = await mongo(config).then(r => r.length > 0)
        if (items.length > 0) {
          return {
            ok: true,
            data: items[0]
          }
        } else {
          return {
            ok: false
          }
        }
      },
      async makeEmail(mailConfig={}) {
        const boundary = 'boundary_string';
        let attachments = '';
        
        // Ajouter chaque fichier Google Drive en tant que pièce jointe
        if (!mailConfig.files) mailConfig.files = []
        // for (const filePath of mailConfig.files) {
        //   attachments += `--${boundary}\n`;
        //   attachments += `Content-Type: application/octet-stream;\n`;
        //   attachments += `MIME-Version: 1.0\n`;
        //   attachments += `Content-Disposition: attachment; filename="${path.basename(filePath)}"\n\n`;
        //   attachments += `${fs.readFileSync(filePath).toString('base64')}\n`;
        // }
        // mailConfig.files.forEach(filePath => {
        //   attachments += `--${boundary}\n`;
        //   attachments += `Content-Type: application/octet-stream;\n`;
        //   attachments += `MIME-Version: 1.0\n`;
        //   attachments += `Content-Disposition: attachment; filename="${path.basename(filePath)}"\n\n`;
        //   attachments += `${fs.readFileSync(filePath).toString('base64')}\n`;
        // });
        
        // mailConfig.files.forEach((fileId) => {
        //   attachments += `--${boundary}\n`;
        //   attachments += 'Content-Type: message/rfc822\n\n';
        //   attachments += `Content-Transfer-Encoding: base64\n\n`;
        //   attachments += `Content-Disposition: attachment; filename="${fileId}"\n\n`;
        //   attachments += `${Buffer.from(`Content-Type: application/pdf\nContent-Transfer-Encoding: base64\n\n${fs.readFileSync(fileId).toString('base64')}`).toString('base64')}\n\n`;
        // });
      
        const str = [
          `Content-Type: multipart/mixed; boundary="${boundary}"\n`,
          'MIME-Version: 1.0\n',
          `From: ${mailConfig.sender}\n`,
          `To: ${mailConfig.to}\n`,
          `Subject: ${mailConfig.subject}\n\n`,
          `--${boundary}\n`,
          'Content-Type: text/html; charset="UTF-8"\n',
          'MIME-Version: 1.0\n\n',
          `${mailConfig.html}\n\n`,
          // `${attachments}`,
          // `--${boundary}--`,
        ].join('');

        
      
        var encodedMail = Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

        // for (const fileId of mailConfig.files) {
        //   const fileData = await api.google.drive.files.get(fileId);
        //   // console.log(fileData);
        //   // console.log(fileData.name);
        //   // console.log(fileData.data);
        //   // const fileBuffer = Buffer.from(fileData, 'binary');
        //   // console.log(fileBuffer);
        //   // const fileBase64 = fileData.toString('base64');
        //   // console.log(fileBase64);
        //   const strAttachment = [
        //     `--${boundary}\n`,
        //     `Content-Type: ${fileData.mimeType}\n`,
        //     `MIME-Version: 1.0\n`,
        //     `Content-Disposition: attachment; filename="test.pdf"\n\n`,
        //   ].join('')
        //   encodedMail += Buffer.from(strAttachment).toString('base64')
        //     // .replace(/\+/g, '-').replace(/\//g, '_');
        //   encodedMail += fileData.toString('base64');
        //   // encodedMail += Buffer.from(`\n\n`).toString('base64')
        //     // .replace(/\+/g, '-').replace(/\//g, '_');
        // }
        
        return encodedMail;
      }
    },
    contacts: {
      add_contact: async function (contact) {
        console.log(`add_contact(${contact.PHONE})`);
      
        if (!contact) return {ok: false, message: "no contact to add"}

        if (!contact.PHONE || contact.PHONE === '') return {ok: false, message: 'no phone'}
        
        contact = await api.tools.clear_item(contact).then(r => r.item)
        const ce = await api.contacts.itemExist({
          $or: [
            {PHONE: contact.PHONE},
            {NAME: contact.NAME, LOCATION: contact.LOCATION},
          ]
        })
        // console.log('contact_exist', ce);
        if (ce.ok === true) {

          console.log("contact already exist");
          for (const f in contact) if (contact[f] === "") delete contact[f]
          const updating = await mongo({
            db: "contacts",
            collection: item._type,
            action: "edit",
            selector: {_id: ce.data._id},
            updator: {$set: contact}
          })
          const response = {
            ok: updating.acknowledged,
            data: ce.data,
            message: updating.acknowledged === true ? updating.modifiedCount + " " + item._type + " updated" : "error update"
          }
          console.log(response);
          return response

        } else {

          // contact = await api.tools.clear_item(contact).then(r => r.item)
          console.log('contact exist');
          delete contact._id
          const creating = await mongo({
            db: "contacts",
            collection: item._type,
            action: "add",
            selector: api.tools.clear_item(contact).then(r => r.item)
          })
          const response = {
            ok: creating.acknowledged,
            data: await api.tools.clear_item(contact, schema).item,
            message: creating.acknowledged === true ? item._type + " created" : "error create"
          }
          return response 

        }
      },
      contact_exist: async function (contact, type='companies') {
        console.log(`contact_exist(${contact.PHONE}, ${type})`);
      
        return await mongo({
          db: "contacts",
          collection: type,
          selector: {
            $or: [
              {PHONE: contact.PHONE},
              {NAME: contact.NAME, LOCATION: contact.LOCATION}
            ]
          }
        }).then(r => {return {ok: r.length > 0, data: r[0]}})
      },
      async rich (contact) {
        console.log('rich()');
        // console.log(contact);
        if (!contact.LOCATION) {
          console.log('no LOCATION');
          return contact
        }
        var POSTCODE = ""
        var regex = /\d{5}/
        if ((POSTCODE = regex.exec(contact.LOCATION)) !== null) {
          POSTCODE = POSTCODE[0]
          if (contact.POSTCODE === "") {
            contact.POSTCODE = POSTCODE
          }
          if (contact.COUNTY === '') {
            contact.COUNTY = POSTCODE[0] + POSTCODE[1]
          }
        }
        if (contact.POSTCODE !== "") {
          if (contact.CITY === "" || contact.COUNTRY === "" || contact.STATE === "") {
            await axios(`https://nominatim.openstreetmap.org/search?format=json&postalcode=${POSTCODE}&addressdetails=1&limit=1&countrycodes=fr`).then(r => {
              r = r.data
              if (r.length > 0) {
                if (contact.STATE === "" && r[0].address.state) {
                  contact.STATE = r[0].address.state || r[0].address.region
                }
                if (contact.COUNTRY === "" && r[0].address.country) {
                  contact.COUNTRY = r[0].address.country
                }
                if (contact.CITY === "") {
                  contact.CITY = r[0].address.city 
                    || r[0].address.municipality
                    || r[0].address.town 
                    || r[0].address.village 
                    || r[0].address.suburb 
                    || r[0].address.city_district 
                }
              }
            })
          }
        } else {
          console.log('no POSTCODE');
        }
        return contact
      },
      companies: {
          delete_duplicate: async function (items = []) {
              for (let index = 0; index < items.length; index++) {
                console.log("item: " + index);
                const item = items[index];
          
                const duplicates = items.filter(el => 
                  el.COMPANY_PHONE === item.COMPANY_PHONE || 
                  el.SOURCE_URL === item.SOURCE_URL)
                // const duplicates = await mongo({
                //   db: "contacts",
                //   collection: "companies",
                //   selector: {
                //     $or: [
                //       { SOURCE_URL: item.SOURCE_URL },
                //       { COMPANY_PHONE: item.COMPANY_PHONE },
                //     ],
                //   },
                // });
                if (duplicates.length > 1) {
                  console.log("duplicates found: " + duplicates.slice(1).length);
                  // const selector = {$or:[]}
                  for (const duplicate of duplicates.slice(1)) {
                    // selector.$or.push({ _id: new ObjectId(duplicate._id) })
                    await mongo({
                      db: "contacts",
                      collection: "companies",
                      action: "delete",
                      selector: { _id: new ObjectId(duplicate._id) },
                    }).then((r) => {
                      console.log(r);
                    });
                  }
                }
              }
          } 
      }
    },
    google: {
        client: {},
        gmail: {
          message: {
            send: async function(mailConfig) {
              try {
                const raw = await api.tools.makeEmail(mailConfig)
                // console.log(raw);
                const res = await api.google.client.gmail.users.messages.send({
                  userId: 'me',
                  requestBody: {
                    raw,
                  },
                });
                console.log('Message sent:', res.data);
                return res.data;
              } catch (err) {
                console.error('Error sending message:', err);
                throw new Error('Failed to send message');
              }
            },
            get: '',
            tracking: {
              track: "",
              getInfos: ""
            }
          },
        },
        drive: {
          files: {
            get: async function (fileId) {
              try {
                const res = await api.google.client.drive.files.get({
                  fileId: fileId,
                  alt: 'media',
                });
                return res.data;
              } catch (err) {
                console.error('Error fetching file data:', err);
                // throw new Error('Failed to fetch file data');
                return err
              }
            }
          },
          folders: {}
        },
        spreadsheet: {
            get: async function (spreadsheetId, sheetName, sheets) {
                // const sheets = google.sheets({ version: 'v4', auth });
                var rows
                try {
                  rows = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: sheetName,
                  });
                  rows = rows.data.values
                } catch (error) {
                  console.log(error);
                  return []
                }
              
                const headers = rows.shift(); // Supprime le premier tableau (noms de colonnes)
              
                const data = rows.map(row => {
                  let rowData = {};
                  row.forEach((cell, i) => {
                    rowData[headers[i]] = cell; // Map chaque cellule à son nom de colonne correspondant
                  });
                  return rowData;
                });
              
                // console.log(data);
                return data
              }
        },
        contacts: {
            create: async function (contacts, auth) {
                const people = google.people({ version: 'v1', auth });
                const res = []
                
                for (const contact of contacts) {
                  const response = await people.people.createContact({
                    requestBody: contact,
                  });
              
                  console.log('Contact créé :', response.data.resourceName);
                  res.push(response.data)
                }
                return res
              }
        },
        calendar: {
            event: {
                create: async function (event, auth) {
                    const calendar = google.calendar({ version: 'v3', auth });
                    try {
                      
                      const response = await calendar.events.insert(event);

                      // console.log(response);
                    
                      // console.log('Événement créé :', response.data.htmlLink);
                      return response.data

                    } catch (error) {
                      console.log(error);
                      return error
                    }
                  

                  }
            }
        }
    },
    appointments: {
      // clear: async function(appointment) {
      //   const schema = await api.tools.get_schema('appointments')
      //   for (const fields in schema.field) {

      //   }
      //   return appointment
      // },
      // clearAll: async function(appointment) {

      // },
      // exist: async function(appointment) {
      //   const PHONE = appointment.PHONE
      //   const DATE = appointment.DATE
      //   const HOUR = appointment.PHONE
      //   return await mongo({
      //     db: 'storages',
      //     collection: "appointments",
      //     selector: {PHONE, DATE, HOUR}
      //   }).then(r => r.length > 0)
      // },
    },
    recruit: {
      cv_proposal: function cv_proposal(selector, appliers=[]) {
        console.log(selector);
        if (!appliers)  return []
        return appliers.filter(a => {
            ok = true
    
            // strict
            if (parseInt(a.COUNTY) !== parseInt(selector.COUNTY || "75")) ok = false
            if (selector.JOB && a.JOB.toLowerCase() !== selector.JOB.toLowerCase()) ok = false
            if (selector.DRIVER_LICENSE && a.DRIVER_LICENSE.toString().toLowerCase() === 'true' && a.DRIVER_LICENSE.toString().toLowerCase() !== selector.DRIVER_LICENSE.toString().toLowerCase()) ok = false
            if (selector.GENDER && a.DRIVER_LICENSE.toLowerCase() !== selector.DRIVER_LICENSE.toLowerCase()) ok = false
            
            // flex
            // if (selector.COUNTY && selector.COUNTY.split(',').some(c => c === a.COUNTY)) ok = false
            
            return ok
            }).filter(a => a.STATUS === "Inscri").sort((a, b) => parseInt(b.SCORE || "0") - parseInt(a.SCORE || "0"))
    }
    }
}

module.exports = api