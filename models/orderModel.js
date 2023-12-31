const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  orderID: {
    type: Number,
    required: true,
  },
  deliveryAddress: {
    type: String,
    required: true,
  },
  paymentOption: {
    type: String,
    enum: ['COD', 'Online','PayPal', 'Wallet'], 
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
  payment_Id:{
    type: String
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
       
    },
    status: {
        type: String,
        default: 'Order Placed'
    },
    paymentStatus:{
      type: String,
      default:'Pending'
   
    },
    expectedDelivery: {
        type: Date,
       
    },
    cancelReason: {
        type: String
    },
    StatusLevel:{
      type:Number,
      default: 1
    },
    returnDate:{
      type: Date,
    }

}],
coupon: {
  code: {
    type: String,
  },
  discountTotal: {
    type: Number,
  },
  minimumSpend: {
    type: Number,
  },
 
},


  // You can add more fields as needed, such as order items, order status, etc.
});

// Create and export the Order model
module.exports = mongoose.model('order', orderSchema);

