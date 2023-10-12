const mongoose = require("mongoose")

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true,
      },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
      price: {
        type: String,
        required: true,
      },
      description:{
        type:String,
        required:true
      },
      image: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      status: {
        type: Boolean,
        required: true,
        default: false,
      }
    })

module.exports = mongoose.model('product',productSchema)