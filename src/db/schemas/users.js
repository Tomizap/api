const users = {
  attributes: {
    firstname: String,
    lastname: String,
    age: Number,
    date_of_birth: String,
    phone: String,
    address: {
      postalCode: String,
      county: String,
      city: String,
      streetAddress: String,
    },
  },
  email: String,
  auth: {
    password: String,
    token: String,
    google: {},
    linkedin: {
      cookies: Array,
      username: String,
      password: String,
    },
    hellowork: {
      cookies: Array,
      username: String,
      password: String,
    },
    pole_emploi: {
      cookies: Array,
      username: String,
      password: String,
    },
    indeed: {
      cookies: Array,
      username: String,
      password: String,
    },
  },
  states: {
    role: String,
    premium: Boolean,
    admin: Boolean,
    applier: Boolean,
    recruiter: Boolean,
    connected: Boolean,
  },
};

module.exports = users;
