const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  deliveryAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'address', // Reference to the Address model
    required: true,
  },
  paymentOption: {
    type: String,
    enum: ['COD', 'PayPal', 'Other'], 
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  expectedDelivery:{
    type:Date
  },
  products: [{
    product_Id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'product',
        required: true
    },

    quantity: {
        type: Number,
        required: true
    },

    total: {
        type: Number,
        required: true
    },

    price: {
        type: Number,

    },expectedDelivery: {
        type: Date,
       
    },

    status: {
        type: String,
        default: 'On the way'
    },

    cancelReason: {
        type: String
    }

}]

  // You can add more fields as needed, such as order items, order status, etc.
});

// Create and export the Order model
module.exports = mongoose.model('order', orderSchema);

