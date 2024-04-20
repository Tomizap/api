const { get } = require("mongoose");
const {mongo} = require("@tomizap/tools");
const userSchema = require("./schemas/users.js");
// const { getCababilitiesByRole } = require("./capabilities.js");

// USER

async function user_exist(user) {
  // console.log("user_exist");
  if (!user.email && !user.token) return false;
  // console.log("user", user);
  return await mongo({ selector: { email: user.email } })
    .then((r) => {
      // console.log(r);
      return r.length > 0;
    })
    .catch((err) => false);
}
module.exports.user_exist = user_exist;

async function user_registration(user) {
  if (await user_exist({ email: user.email })) {
    return {
      ok: false,
      message: "Vous êtes déjà inscri",
    };
  } else {
    const db_user = {};

    for (const key in user) {
      db_user[key] = user[key];
    }

    // console.log(db_user);

    db_user.token = "key";

    if (!db_user.role) db_user.role = "student";
    if (db_user.role === "student") {
      db_user.scopes.company_internships = true;
    }

    // console.log("------------------------");

    // console.log(db_user);

    await mongo({ selector: db_user });

    return {
      ok: true,
      message: "Inscription validée",
      db_user,
    };
  }
}
module.exports.user_registration = user_registration;

async function user_login(credentials) {
  await credentials;
  // console.log(credentials);
  if (!credentials.email) {
    console.log("Veuillez fournir une adresse mail");
    return {
      ok: false,
      message: "Veuillez fournir une adresse mail",
    };
  }
  if (!credentials.auth || (!credentials.auth.password && !credentials.auth.token)) {
    console.log("Incorrect credentials");
    return {
      ok: false,
      message: "Incorrect credentials",
      data: credentials
    };
  }
  const ue = await user_exist({ email: credentials.email });
  // console.log(ue);
  if (ue === true) {
    // console.log('user exist');
    return await mongo({ selector: { email: credentials.email } }).then((db_users) => {
      if (typeof db_users === 'undefined') return {
        ok: false,
        message: "un problème est survenu"
      }
      const db_user = db_users[0];
      if (db_user.auth.password === credentials.auth.password || db_user.auth.token === credentials.auth.token) {
        return {
          ok: true,
          message: "authentification réussie",
          user: db_user,
        };
      } else {
        console.log("authentification échoué");
        return {
          ok: false,
          message: "authentification échoué",
        };
      }
    });
  } else {
    console.log("Cette utilisateur n'existe pas");
    return {
      ok: false,
      message: "Cette utilisateur n'existe pas: " + credentials.email,
    };
  }
}
module.exports.user_login = user_login;

// DOCUMENTS

// async function get_schema(type) {
//   const schemas = await mongo({
//     collection: "schemas",
//     selector: {
//       name: type
//     }
//   })
//   return schemas

//   if (schemas.length > 0) {
//     const schema = schemas[0]
//     for (const key in object) {

//     }
//   } else {

//   }

// }
// get_schema('company').then(r => console.log(r))