const mongoose = require("mongoose")

const categorySchema = mongoose.Schema({
   categoryName:{
        type:String,
        required:true  
      },
    categoryDescription:{
       type:String,
       required:true
      },
      is_listed:{
        type:Boolean,
        required:true
      }

    })

module.exports = mongoose.model('category',categorySchema)