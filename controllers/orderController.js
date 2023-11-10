const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")
const Razorpay = require("razorpay")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")
var crypto = require("crypto");

var instance = new Razorpay({
  key_id: process.env.Razorpay_KEY_ID,
  key_secret: process.env.Razorpay_KEY_SECRET
});

const placeOrder = async (req, res) => {
  try {
    const { addressId, paymentOption } = req.body;
    const userId = req.session.user_id;
    const totalAmount = parseInt(req.body.totalAmount);

    const user = await User.findById(userId);

    if (paymentOption === 'Wallet' && user.wallet < totalAmount) {
      return res.status(400).json({
        success: false,
        insufficientBalance: true, // Indicate insufficient wallet balance
        message: 'Wallet balance is insufficient. Please choose another payment option.',
      });
    }

    // Fetch the cart items from the database based on the user's ID
    const cartItems = await Cart.findOne({ user_id: userId }).populate({
      path: 'items.product_Id',
      model: 'product',
    });

    if (!cartItems) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Unable to place an order.',
      });
    }

    const orderDataUser = await Order.find({ user: userId });
    let status = paymentOption == 'COD' ? 'placed' : 'pending'
    function generateOrderID() {
      return Math.floor(Math.random() * 900000) + 100000;
    }

    let orderIdSample;

    if (!orderDataUser[0]) {
      orderIdSample = generateOrderID();
    } else {
      const lastOrder = orderDataUser[orderDataUser.length - 1];
      orderIdSample = lastOrder.orderID + 1;
    }

    const products = cartItems.items.map((item) => ({
      product_Id: item.product_Id,
      total: item.total,
      quantity: item.quantity,
    }));

    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7);

    if(paymentOption==='Wallet' && user.wallet >= totalAmount){
      const userid=req.session.user_id
      await User.findByIdAndUpdate({_id:userid},{$inc:{wallet:-totalAmount},$push: {
        walletHistory: {
          date: new Date(),
          amount: totalAmount,
          description: `Buy product with wallet - Order ${orderIdSample}`,
          transactionType:'Debit'
        },
      },})
      status='placed'
    
     }


    const newOrder = new Order({
      user: userId,
      orderID: orderIdSample,
      deliveryAddress: addressId,
      paymentOption,
      totalAmount,
      orderDate: new Date(),
      expectedDelivery: deliveryDate,
      products: products,
    });

    const orderData =await newOrder.save();
    const orderId = newOrder._id;

    if (status == 'placed') {
      for (const item of cartItems.items) {
        const productId = item.product_Id._id;
        const quantity = parseInt(item.quantity, 10);
        await Product.findByIdAndUpdate(
          { _id: productId },
          {
            $inc: { quantity: -quantity },
          }
        );
        if(paymentOption == 'Wallet')
        {
          await Order.findOneAndUpdate(
            { _id: orderId },
            { $set: { 'products.$[].paymentStatus': 'Success' } }
        );
        }
        
      }
      res.json({ codSuccess:true})
      await Cart.findOneAndDelete({ user_id: userId });

    } else if (paymentOption === 'Online') {
      
      var options = {
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: "" + orderId
      };

      instance.orders.create(options, function (err, order) {
        if (err) {
          console.error(err); // Handle any errors that occurred during the API call
         
        } else {
          
          res.json({ order }); // Send the order details back to the client
        }
      });
    }

    
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to place the order' });
  }
};

// Validate Payment Verification Function
const validatePaymentVerification = async (req, res) => {
  try {
    const body = req.body;
    console.log(body)
    const userid = req.session.user_id;
    let hmac = crypto.createHmac("sha256", process.env.Razorpay_KEY_SECRET); 
    hmac.update(
      body.payment.razorpay_order_id +
        "|" +
        body.payment.razorpay_payment_id
    );
    const hmacValue = hmac.digest("hex");

    console.log('Calculated HMAC:', hmacValue);
console.log('Received razorpay_signature:', body.payment.razorpay_signature);

    if (hmacValue === body.payment.razorpay_signature) {
      const items = await Order.findByIdAndUpdate(
        { _id: body.order.receipt },
        { $set: { payment_Id: body.payment.razorpay_payment_id } }
      );
      await Order.findByIdAndUpdate(
        { _id: body.order.receipt },
        { $set: { status: 'Success' } }
      );
      for (let item of items.products) {
        await Product.updateOne(
          { _id: item.product_Id },
          { $inc: { quantity: -item.quantity } }
        );
      }
      await Order.findOneAndUpdate(
        { _id: body.order.receipt },
        { $set: { 'products.$[].paymentStatus': 'Success' } }
    );

      await Cart.deleteOne({ user_id: userid });
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


const loadOrderPlaced = async (req, res, next) => {
  try{
  const userId = req.session.user_id;
  const orderId = req.query.id;

  let order; // Declare order variable outside the if-else block

  if (orderId) {
      order = await Order.findOne({ _id: orderId })
          .populate({
              path: 'products.product_Id',
          })
          .sort({ orderDate: -1 });
  } else {
      order = await Order.findOne({ user: userId })
          .populate({
              path: 'products.product_Id',
          })
          .sort({ orderDate: -1 });
  }

  const products = await Cart.findOne({ user_id: userId }).populate('items.product_Id');

  if (!order) {
      return res.status(404).json({
          success: false,
          message: 'No orders found for the user.',
      });
  }

    res.render("orderSuccess", { order ,products,userIsLoggedIn: req.session.user_id ? true : false});
  } catch (err) {
    next(err);
  }
};


const loadOrder = async(req,res)=>{
  try{
    const userId = req.session.user_id;
    const products = await Cart.findOne({user_id:userId}).populate('items.product_Id')
    const orders = await Order.find({user:userId}).populate('user').sort({ orderDate: -1 });
      res.render("orders",{orders:orders,userIsLoggedIn: req.session.user_id ? true : false,products})
  }
  catch(error)
  {
    console.log(error.message)
  }
}


const orderDetails = async (req, res, next) => {
  try{
  const userId = req.session.user_id;
  const orderId = req.query.id;

  let order; // Declare order variable outside the if-else block

  if (orderId) {
      order = await Order.findOne({ _id: orderId })
          .populate({
              path: 'products.product_Id',
          })
          .sort({ orderDate: -1 });
  } else {
      order = await Order.findOne({ user: userId })
          .populate({
              path: 'products.product_Id',
          })
          .sort({ orderDate: -1 });
  }

  const products = await Cart.findOne({ user_id: userId }).populate('items.product_Id');

  if (!order) {
      return res.status(404).json({
          success: false,
          message: 'No orders found for the user.',
      });
  }

    res.render("orderDetails", { order ,products,userIsLoggedIn: req.session.user_id ? true : false});
  } catch (err) {
    next(err);
  }
};


const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orderId = req.params.orderId;
    const productId = req.params.productId;

    // Find the order by orderId and user ID
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let canCancel = true;
    let refundedAmount = 0;

    for (const product of order.products) {
    
      if(product.product_Id._id.toString() === productId)
      {
        console.log(product.status)
      if (product.status === 'Delivered' || product.status === 'Canceled') {
        canCancel = false;
        break; // Exit the loop if any product cannot be canceled
      } else {
          refundedAmount += product.total; // Accumulate the refunded amount
        }
    }
    }

    if (!canCancel) {
      return res.status(400).json({ success: false, message: 'Order cannot be canceled' });
    }

    // Set the status of the product with the specified productId to 'Canceled' within the order
    for (const product of order.products) {
      if (product.product_Id._id.toString() === productId) {
        product.status = 'Canceled';
         // Save the product status
        await Product.findByIdAndUpdate(product.product_Id._id, {
          $inc: { quantity: product.quantity },
        });

        if(order.paymentOption=="Online"||order.paymentOption=="Wallet"){

          order.totalAmount -= refundedAmount;

          await User.findByIdAndUpdate({_id:userId},{$inc:{wallet:product.total},$push: {
           walletHistory: {
             date: new Date(),
             amount: product.total,
             description: `Refunded for Order cancel - Order ${order.orderID}`,
             transactionType:'Credit'
           },
         },})
            }
      }
    }

    await order.save();

    res.json({ success: true, message: 'Order has been canceled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel the order' });
  }
};



module.exports ={
    placeOrder,
    loadOrderPlaced,
    loadOrder,
    orderDetails,
    cancelOrder,
    validatePaymentVerification
    
}