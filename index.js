const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const session = require("express-session");
const config = require("./config/config");
const multer = require("multer");

mongoose.connect("mongodb://127.0.0.1:27017/ecommercemg");

const app = express();

const PORT = process.env.PORT || 4000;

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
  }) 
);

app.use("/public", express.static(path.join(__dirname, "../public")));

const disableBackButton = (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store,must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
};

const userRoute = require("./routes/userRoute.js");
app.use("/", disableBackButton, userRoute);
 
const adminRoute = require("./routes/adminRoute");
app.use("/admin", disableBackButton, adminRoute);

app.listen(PORT, function () {
  console.log("Server is running on Port http://localhost:4000");  
});
 