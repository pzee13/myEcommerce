const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference the User model
    required: true
  },
  items: [
    {
      product_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      quantity: {
        type: Number,
        default: 1,
        required: true,
      },
      total: {
        type: Number,
        default:0
      },
      price:{
        type:Number,
        required: true
      }
    },
  ],
  count: {
    type: Number,
    default:1
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model("Cart", cartSchema);