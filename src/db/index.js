const mongoose = require("mongoose");

// model({ action: "add", selector: { email: "re" } })
//   .then(async (model) => {
//     console.log(model);
//     // const document = await new model({ test: "123" });
//     // console.log(document);
//   })
//   .catch((err) => console.log(err));

// async function model(db = "tools", collection = "users") {
//   await mongoose.connect(
//     `mongodb+srv://tom:jHq13Y2ru1y5Dijb@cluster0.crkabz3.mongodb.net/${db}?retryWrites=true&w=majority`
//   );
//   // console.log(require(`./schemas/${collection}.js`));
//   const Schema = new mongoose.Schema(require(`./schemas/${collection}.js`));
//   // console.log(Schema);
//   return mongoose.model(collection, Schema);

//   // callback(mongoose.model(collection, Schema));
// }

main({ action: "add", selector: { email: "re" } })
  .then(async (r) => {
    console.log(r);
    // const document = await new model({ test: "123" });
    // console.log(document);
  })
  .catch((err) => console.log(err));

async function main(config = {}) {
  const db = config.db || "tools";
  const collection = config.collection || "users";
  const action = config.action || "get";
  const selector = config.selector;
  const updator = config.updator;

  await mongoose.connect(
    `mongodb+srv://tom:jHq13Y2ru1y5Dijb@cluster0.crkabz3.mongodb.net/${db}?retryWrites=true&w=majority`
  );
  // console.log(require(`./schemas/${collection}.js`));
  // const Schema = new mongoose.Schema(require(`./schemas/${collection}.js`));
  const Schema = new mongoose.Schema(require(`./schemas/${collection}.js`));
  // console.log(Schema);
  // console.log(await Schema.obj());
  return;
  const Model = mongoose.model(collection, Schema);
  // console.log(Model);

  if (action === "get") {
    const documents = await Model.find(selector);
    console.log(documents);
    return documents;
  } else if (action === "add" || action === "create") {
    const document = await new Model(selector);
    // console.log(document);
    return await document.save();
  } else if (action === "edit" || action === "edit") {
    if (typeof selector === "string") {
      return await Model.findByIdAndUpdate(selector, updator);
    } else {
      return await Model.findOneAndUpdate(selector, updator);
    }
    // console.log(update);
    // return update;
  } else if (action === "delete") {
  }

  //   // console.log(document.name); // 'Silence'

  //   // await document.save();
}

// module.exports = main;
