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


// const placeOrder =  async (req, res) => {
//     try {
//       const { addressId, paymentOption, totalAmount } = req.body;
//       const userId = req.session.user_id; // Assuming you store user ID in the session
  
//       // Create a new order
//       const newOrder = new Order({
//         user: userId, // Set the user ID
//         deliveryAddress: addressId, // Set the selected delivery address
//         paymentOption,
//         totalAmount,
//         orderDate: new Date(),
//         // You can add more details to the order as needed
//       });
  
//       // Save the order to the database
//       await newOrder.save();
  
//       // Update product stock (for COD payments)
//       if (paymentOption === 'COD') {
//         const cartItems = req.session.cart; // Assuming you store cart items in the session
//         for (const item of cartItems) {
//           const productId = item.productId;
//           const quantity = item.quantity;
  
//           // Decrease the stock of the product
//           await Product.findByIdAndUpdate(productId, {
//             $inc: { quantity: -quantity },
//           });
//         }
//       }
  
//       // You can also clear the user's cart or perform other necessary actions here
  
//       // Send a success response
//       res.json({ success: true, message: 'Order placed successfully' });
//     } catch (error) {
//       console.error(error);
//       // Handle errors and respond with an error message
//       res.status(500).json({ success: false, message: 'Failed to place the order' });
//     }
//   }

// const placeOrder = async (req, res) => {
//     try {
//       const { addressId, paymentOption, totalAmount } = req.body;
//       const userId = req.session.user_id; // Assuming you store user ID in the session
  
//       // Fetch the cart items from the database based on the user's ID
//       const cartItems = await Cart.findOne({ user_id: userId }).populate({
//         path: 'items.product_Id',
//         model: 'product', // Assuming the model name for products is 'product'
//       });
  
//       if (!cartItems) {
//         return res.status(400).json({
//           success: false,
//           message: 'Cart is empty. Unable to place an order.',
//         });
//       }
  
//       // Create a new order
//       const newOrder = new Order({
//         user: userId, // Set the user ID
//         deliveryAddress: addressId, // Set the selected delivery address
//         paymentOption,
//         totalAmount,
//         orderDate: new Date(),
//         // You can add more details to the order as needed
//       });
  
//       // Save the order to the database
//       await newOrder.save();
  
//       // Update product stock (for COD payments)
//       if (paymentOption === 'COD') {
//         for (const item of cartItems.items) {
//           const productId = item.product_Id._id;
//           const quantity = item.quantity;
  
//           // Decrease the stock of the product
//           await Product.findByIdAndUpdate(productId, {
//             $inc: { quantity: -quantity },
//           });
//         }
//       }
  
//       // You can also clear the user's cart or perform other necessary actions here
  
//       // Send a success response
//       res.json({ success: true, message: 'Order placed successfully' });
//     } catch (error) {
//       console.error(error);
//       // Handle errors and respond with an error message
//       res.status(500).json({ success: false, message: 'Failed to place the order' });
//     }
//   };
  
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
  
      // Create a new order
      const newOrder = new Order({
        user: userId,
        deliveryAddress: addressId,
        paymentOption,
        totalAmount,
        orderDate: new Date(),
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
      await Cart.findOneAndUpdate({ user_id: userId }, { $set: { items: [] } });
      // Send a success response
      res.json({ success: true, message: 'Order placed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to place the order' });
    }
  };

module.exports ={
    placeOrder
}