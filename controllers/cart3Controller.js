// const mongoose = require('mongoose');
// const Admin = require("../models/adminModels/adminModel")
// const User = require("../models/userModels/userModel")
// const Cart = require("../models/cartModel")
// const Category = require("../models/categoryModel")
// const Product = require("../models/productModel")
// const bcrypt = require('bcrypt')
// const path = require("path")
// const fs = require("fs")



// const loadCart = async(req,res)=>{
//     try{
//         const user_id = req.session.user_id
//         console.log(user_id)
//         const products = await Cart.findOne({user_id:user_id}).populate('items.product_Id')
//         res.render('cart10',{products})
//     }
//     catch(error)
//     {
//         console.log(error.message);
//     }
// }
// const addToCart = async (req, res) => {
//     try {
//       const { user_id, product_id, quantity, price } = req.body;
  
//       // Check if the user has an existing cart
//       let cart = await Cart.findOne({ user_id });
//       if (!cart) {
//         // If the user doesn't have a cart, create a new one
//         cart = new Cart({
//           user_id,
//           items: [],
//           totalPrice: 0,
//         });
//       }
  
//       // Check if the product is already in the cart
//       const existingItem = cart.items.find(
//         (item) => item.product_Id.toString() === product_id
//       );
  
//       if (existingItem) {
//         // If the product already exists in the cart, update its quantity and total price
//         existingItem.quantity += quantity;
//         existingItem.total += price * quantity;
//       } else {
//         // If the product is not in the cart, add it as a new item
//         cart.items.push({
//           product_Id: product_id,
//           quantity,
//           total: price * quantity,
//           price,
//         });
//       }
  
//       // Update the total price of the cart
//       cart.totalPrice += price * quantity;
  
//       // Save the cart to the database
//       await cart.save();
  
//       res.json({ success: true, message: "Product added to the cart." });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ success: false, message: "Error adding the product to the cart." });
//     }
//   };

// module.exports={
//     loadCart,
//     addToCart
// }
