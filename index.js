const mongoose = require("mongoose")
const path = require("path")

mongoose.connect("mongodb://127.0.0.1:27017/ecommercemg")

const express = require("express")
const app = express()

const PORT = process.env.PORT || 4000

const userRoute = require('./routes/userRoute')
app.use('/',userRoute)

app.listen(PORT,function(){
    console.log("Server is running on Port http://localhost:4000")  
})    