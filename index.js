const mongoose = require("mongoose")
const path = require("path")
const session = require("express-session")
const config = require("./config/config")

mongoose.connect("mongodb://127.0.0.1:27017/ecommercemg")

const express = require("express")
const app = express()

const PORT = process.env.PORT || 4000

app.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:true
}))

app.use('/public',express.static(path.join(__dirname,'../public')))

const userRoute = require('./routes/userRoute.js')
app.use('/',userRoute)

const adminRoute = require('./routes/adminRoute')
app.use('/admin',adminRoute) 

app.listen(PORT,function(){
    console.log("Server is running on Port http://localhost:4000")  
})    