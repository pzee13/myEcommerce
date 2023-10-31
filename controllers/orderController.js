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
        deliveryAddress: addressId,
        paymentOption,
        totalAmount,
        orderDate: new Date(),
        expectedDelivery: deliveryDate,
        products:products
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


//   const loadOrderPlaced=async(req,res,next)=>{
//     try {
//           const id=req.session.user_id
//          const order=await Order.findOne({user:id}).populate(
//            "products.product_Id"
//          ).sort({date:-1})
   
//         res.render('orderSuccess',{order})
        
//     } catch (err) {
//       next(err)
//     }
// }

const loadOrderPlaced = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    
    const products = await Cart.findOne({user_id:userId}).populate('items.product_Id')
    // Find the user's latest order and populate the necessary fields
    const order = await Order.findOne({ user: userId })
      .populate({
        path: 'products.product_Id', // Replace with the correct model name
      })
      .populate('deliveryAddress') // Populate the delivery address if needed
      .sort({ orderDate: -1 }); // Sort to get the latest order

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for the user.',
      });
    }

    res.render('orderSuccess', { order ,products,userIsLoggedIn: req.session.user_id ? true : false});
  } catch (err) {
    next(err);
  }
};

module.exports ={
    placeOrder,
    loadOrderPlaced
}