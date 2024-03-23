const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
var cors = require("cors");
var cookieParser = require("cookie-parser");

const app = express();
const router = require("./router.js");

require("dotenv").config();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(router);

module.exports = app;
