const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://tom:jHq13Y2ru1y5Dijb@cluster0.crkabz3.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function mongo(config) {
  var response;
  if (!config) config = {};
  const db = config.db || "tools";
  const col = config.collection || "users";
  const action = config.action || "get";
  const selector = config.selector || {};
  // selector.userAccess = { $in: ["zaptom.pro@gmail.com"] };
  const updator = config.updator;

  try {
    await client.connect();
    const collection = client.db(db).collection(col);
    if (action === "get") {
      response = await collection.find(selector).toArray();
    } else if (action === "add" || action === "create") {
      response = await collection.insertOne(selector);
    } else if (action === "edit" || action === "edit") {
      response = await collection.updateOne(selector, updator);
    } else if (action === "delete") {
      response = await collection.deleteOne(selector);
    }
  } catch (err) {
    console.log("MongoError: " + err);
  } finally {
    await client.close();
  }

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
