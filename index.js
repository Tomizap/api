const express = require("express");
const mongoose = require("mongoose");
const app = express();
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
var cors = require("cors");
var cookieParser = require("cookie-parser");
// const { google } = require('googleapis')
require("dotenv").config();
require('tz-mongoose-schemas')
require('tz-toolbox')

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to database!");

    // login and register
    app.post('/login', require('./controllers/user.controller.js').login)
    app.post('/register', require('./controllers/user.controller.js').register)

    // auth
    app.use(require('./controllers/user.controller.js').auth)

    // init
    app.use(require('./controllers/google.controller.js').init)
    app.use(require('./controllers/stripe.controller.js').init)
    // ... add more third party controller init

    // get user
    app.get('/me', (req, res) => { res.json(req.user) })

    // google router
    app.use('/google/spreadsheet', require('./controllers/user.controller.js').login)

    // routes
    app.use(require("./router.js"));

    // listening
    app.listen(3000, () => {
      console.log("Server is running on port 3000");
    });

  }).catch((err) => {
    console.log("MongoError: ", err);
  });
