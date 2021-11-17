const express = require("express");
const app = express();
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
app.use(cors());

const models = require("./models");
const dotenv = require("dotenv");
dotenv.config();

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended:false}))

app.use("/api/users", require("./routes/users"));
app.use("/api/contents", require("./routes/contents"));

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server Running at ${port}`);
});
