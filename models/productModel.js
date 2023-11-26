const mongoose = require("mongoose")

const productSchema = mongoose.Schema({
    productName: {
        type: String,
        required: true,
      },
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        required: true,
      },
      size: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      description:{
        type:String,
        required:true
      },
      images: {
        type: Array,
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
      },
      offer : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'offer'
    },
    discountedPrice:{
      type:Number
    },
    reviews: [
      {
        user: {
          userId:{
            type:String
          },
          firstName: {
            type: String,
          },
          lastName: {
            type: String,
          },
        },
        rating: {
          type: Number,
        },
        comment: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    })

module.exports = mongoose.model('product',productSchema)