const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const session = require("express-session");
const config = require("./config/config");
const dotenv = require("dotenv")

const app = express();

dotenv.config()  
 
const adminRoute = require("./routes/adminRoute");

const userRoute = require("./routes/userRoute.js");
const PORT =  process.env.PORT 

 

mongoose.connect(process.env.MONGO_DB).then(()=>{
  console.log("Mongodb Connected...");     
})                 
 


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

app.set('view engine','ejs')
app.set('views','./views/users')



app.use("/admin", disableBackButton, adminRoute);

app.use("/", disableBackButton, userRoute);
 
app.listen(PORT, function () {
  console.log(`Server is running on Port http://localhost:${PORT}`);  
});
 