const mongoose = require("mongoose")

const adminSchema = mongoose.Schema({
    adminEmail:{
        type:String,
        required:true  
      },
      adminPassword:{
       type:String,
       required:true
      }

            })

module.exports = mongoose.model('Admin',adminSchema)