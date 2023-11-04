const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")



const placeOrder = async (req, res) => {
    try {
      const { addressId, paymentOption } = req.body;
      const userId = req.session.user_id;
        console.log(paymentOption)
        console.log(addressId)
      // Parse totalAmount as a number
      const totalAmount = parseFloat(req.body.totalAmount);
  
      // Check if paymentOption is valid
  
      // Fetch the cart items from the database based on the user's ID
      const cartItems = await Cart.findOne({ user_id: userId })
      .populate({
        path: 'items.product_Id', 
        model: 'product', // Replace 'product' with the correct model name ('Product' or whatever your model is named)
      });

      if (!cartItems) {
        return res.status(400).json({
          success: false,
          message: 'Cart is empty. Unable to place an order.',
        });
      }

      const orderDataUser = await Order.find({ user: userId });


      function generateOrderID() {
        return Math.floor(Math.random() * 900000) + 100000;
      }
  
      let orderIdSample;
  
      if (!orderDataUser[0]) {
        orderIdSample = generateOrderID();
        console.log(orderIdSample)
      } else {
        const lastOrder = orderDataUser[orderDataUser.length - 1];
        orderIdSample = lastOrder.orderID + 1;
      }
      console.log(orderIdSample)

      const products = cartItems.items.map((item) => ({
        product_Id: item.product_Id,
        total: item.total,
        quantity: item.quantity,
      }));
      
      const today = new Date();
      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 7);
      // Create a new order
      const newOrder = new Order({
        user: userId,
        orderID:orderIdSample,
        deliveryAddress: addressId,
        paymentOption,
        totalAmount,
        orderDate: new Date(),
        expectedDelivery: deliveryDate,
        products:products,
        // You can add more details to the order as needed
      });
  
      // Save the order to the database
      await newOrder.save();
  
      // Update product stock (for COD payments)
      if (paymentOption === 'COD') {
        for (const item of cartItems.items) {
          const productId = item.product_Id._id;
          const quantity = parseInt(item.quantity, 10);
          console.log(quantity)

          await Product.findByIdAndUpdate({_id:productId}, {
            $inc: { quantity: -quantity },
          });
        }
      }
  
      // You can also clear the user's cart or perform other necessary actions here
      await Cart.findOneAndDelete({user_id:userId}) 
      
      // Send a success response
      res.json({ success: true, message: 'Order placed successfully' });
      
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to place the order' });
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
    const orders = await Order.find({user:userId}).populate('user')
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

    for (const product of order.products) {
    
      if(product.product_Id._id.toString() === productId)
      {
        console.log(product.status)
      if (product.status === 'Delivered' || product.status === 'Canceled') {
        canCancel = false;
        break; // Exit the loop if any product cannot be canceled
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
    cancelOrder
    
}