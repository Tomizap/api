const { google } = require("googleapis");
const axios = require('axios')
const mongo = require('./db/mongo.js')
const { v4: uuidv4 } = require('uuid');

// const oauth2Client = new google.auth.OAuth2(
//     "1077742480191-sel8t74e6ivuu19m9r8h3aar15fd65r1.apps.googleusercontent.com", // YOUR_CLIENT_ID
//     "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", // YOUR_CLIENT_SECRET
//     // "http://api.tom-zapico.com/oauth/google/callback" // YOUR_REDIRECT_URI
//   );

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
      clear_items: async function (items=[], schema) {
        console.log('clear_items()');
        if (!schema) return items
        // console.log(schema);
        for (var item of items) {
          console.log('------------------');
          console.log('item ', items.indexOf(item)+1);
          const _id = item._id
          const clearing = api.tools.clear_item(item, schema)
          item = clearing.item
      
          // mongo update
          if (
            Object.keys(clearing.updator.$set).length > 0 ||
            Object.keys(clearing.updator.$unset).length > 0 ||
            Object.keys(clearing.updator.$push).length > 0 ||
            Object.keys(clearing.updator.$rename).length > 0
            ) {
              console.log(clearing.updator);
              await mongo({
                db: "contacts",
                collection: schema.type,
                action: 'edit',
                selector: {
                  _id
                },
                updator: clearing.updator
              })
                .then(result => console.log(result))
            }
        }
        return items
      },
      clear_item: function(item={}, schema) {
        console.log('clear_item()');
        if (!schema) return item
        // console.log(schema);
        schema = schema.fields
        
        const updator = {$set: {}, $unset: {}, $rename: {}, $push: {}}

        // alias mapping
        for (const field in item) { 
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
              var newEmail = item[field]
                .replace(/\.$/gi, '')
              if (newEmail !== item[field]) {
                item[field] = newEmail
                updator.$set[field] = item[field]
              }
            
            }
        }

        return {item, updator}
      },
    },
    contacts: {
      add_contact: async function (contact, schema) {
        console.log(`add_contact(${contact.PHONE}, ${schema.type})`);
      
        if (!contact) return {ok: false, message: "no contact"}
        if (!schema) return {ok: false, message: "no schema"}
        if (!contact.PHONE || contact.PHONE === '') return {ok: false, message: 'no phone'}
      
        const ce = await api.contacts.contact_exist(contact, schema.type)
        console.log('contact_exist', ce);
        if (ce.ok === true) {
      
          console.log("contact already exist");
          const updating = await mongo({
            db: "contacts",
            collection: schema.type,
            action: "edit",
            selector: {_id: ce.data._id},
            updator: {$set: contact}
          })
          return {
            ok: updating.acknowledged,
            data: contact,
            message: updating.acknowledged === true ? updating.modifiedCount + " contact updated" : "error update"
          }
        
        } else {
      
          delete contact._id
          const creating = await mongo({
            db: "contacts",
            collection: schema.type,
            action: "add",
            selector: api.tools.clear_item(contact, schema).item
          })
          // console.log(creating);
          return {
            ok: creating.acknowledged,
            data: contact,
            message: creating.acknowledged === true ? "contact created" : "error create"
          }
      
        }
      
      },
      contact_exist: async function (contact, type='companies') {
        console.log(`contact_exist(${contact.PHONE}, ${type})`);
      
        return await mongo({
          db: "contacts",
          collection: type,
          selector: {
            $or: [{PHONE: contact.PHONE}]
          }
        }).then(r => {return {ok: r.length > 0, data: r[0]}})
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
        gmail: {
          message: {
            send: '',
            get: '',
            tracking: {
              track: "",
              getInfos: ""
            }
          },
        },
        drive: {
          files: {
            get: async function (fileId, auth) {
              const drive = google.drive({ version: 'v3', auth: credentials });
              const response = await drive.files.get({
                fileId: fileId,
                alt: 'media', // Use 'media' to get the actual file content
              }, { responseType: 'stream' });
              return response
            },
            post: '',
            delete: '',
          },
          folders: {}
        },
        spreadsheet: {
            get: async function (spreadsheetId, sheetName, auth) {
                const googleSheets = google.sheets({ version: 'v4', auth });
              
                var rows = await googleSheets.spreadsheets.values.get({
                  spreadsheetId,
                  range: sheetName,
                });
                rows = rows.data.values
              
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
                  
                    const response = await calendar.events.insert({
                      calendarId: 'primary',
                      resource: event,
                      conferenceDataVersion: 1,
                      sendUpdates: 'all',
                    });

                    console.log(await response);
                  
                    console.log('Événement créé :', response.data.htmlLink);
                    return response.data
                  }
            }
        }
    }
}

module.exports = api