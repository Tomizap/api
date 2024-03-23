async function update(req, res, next) {
  // const user = req.user;
  const userModel = require("../db/schemas/users.js");

  for (const key in userModel) {
    const value = userModel[key];
    if (!req.user[key]) req.user[key] = value;
    if (typeof value === "object" && !value[0]) {
      for (const keyValue in value) {
        if (!req.user[key][keyValue]) req.user[key][keyValue] = value[keyValue];
      }
    }
  }

  // return res.json(req.user);

  next();
}
module.exports = update;
