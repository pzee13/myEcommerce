const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderID: {
        type: Number,
        // required: true
    },

    deliveryAddress: {
        type: String,
        required: true
    },

    userName: {
        type: String,
        required: true
    },

    totalAmount: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    payment: {
        type: String,
        required: true
    },

    expectedDelivery: {
        type: Date,
        required: true
    },

    paymentId: {
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

})

module.exports = mongoose.model('order', orderSchema)