const mongo = require("./mongo.js");
const userSchema = require("./schemas/users.js");
// const { getCababilitiesByRole } = require("./capabilities.js");

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

async function user_login(user) {
  await user;
  if (!user.email) {
    console.log("Veuillez fournir une adresse mail");
    return {
      ok: false,
      message: "Veuillez fournir une adresse mail",
    };
  }
  if (!user.password && !user.token) {
    console.log("Veuillez fournir un moyen d'authentification");
    return {
      ok: false,
      message: "Veuillez fournir un moyen d'authentification",
    };
  }
  const ue = await user_exist({ email: user.email });
  // console.log(ue);
  if (ue === true) {
    return await mongo({ selector: { email: user.email } }).then((db_users) => {
      const db_user = db_users[0];
      if (db_user.password === user.password || db_user.token === user.token) {
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
      message: "Cette utilisateur n'existe pas",
    };
  }
}
module.exports.user_login = user_login;
