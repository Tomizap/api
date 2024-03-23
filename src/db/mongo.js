const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

async function mongo(config) {
  var response;
  if (!config) config = {};
  const uri = config.uri || "mongodb+srv://tom:jHq13Y2ru1y5Dijb@cluster0.crkabz3.mongodb.net/?retryWrites=true&w=majority";
  const db = config.db || "tools";
  const col = config.collection || "users";
  const action = config.action || "get";
  const selector = config.selector || {};
  try {
    if (selector._id && typeof selector._id === 'string') {
      selector._id = new ObjectId(selector._id)
    }
    if (selector.$or) selector.$or = selector.$or.map(sel => {
        if (sel._id) sel._id = new ObjectId(sel._id)
        return sel
    }) 
  } catch (error) {
    console.log(error);
  }
  // selector.userAccess = { $in: ["zaptom.pro@gmail.com"] };
  const updator = config.updator;

  const limit = parseInt(config.limit) || 10
  if (!config.page) config.page = 0

  console.log(`mongo(${action}, ${db}, ${col})`);
  
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    const collection = client.db(db).collection(col);
    if (action === "get") {
      response = await collection.find(selector)
        .skip(limit * parseInt(config.page))
        .limit(limit)
        .toArray();
    } else if (action === "post" || action === "add" || action === "create") {
      response = await collection.insertOne(selector);
    } else if (action === "put" || action === "edit" || action === "update") {
      response = await collection.updateOne(selector, updator);
    } else if (action === "delete") {
      response = await collection.deleteOne(selector);
    }
  } catch (err) {
    console.log("MongoError: " + err);
  } finally {
    try {
      await client.close();
    } catch (error) {
      if (action === "get") {
        response = []
      } else {
        response = {
          acknowledged: false
        }
      }
      console.log("MongoClosingError: ", error);
    }
  }

  // response.config = {uri, db, collection: col, selector, updator}
  return response;
}
module.exports = mongo;

// mongo({
//   collection: "automnations",
//   action: "create",
//   selector: {
//     urls: ["tests.com"],
//   },
// }).then((r) => {
//   console.log(r);
// });
