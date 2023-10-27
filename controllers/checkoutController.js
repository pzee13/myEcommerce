const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel")
const Address = require("../models/addressModel")
const Wishlist = require("../models/wishlistModel")
const Product = require("../models/productModel")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")


const loadCheckout = async (req, res,next) => {
    try {
        const id = req.session.user_id;
        const UserData=await User.findById(id)
        const products = await Cart.findOne({ user_id:id }).populate(
            "items.product_Id"
        );
        const address = await Address.findOne({ user_id:id },{address:1})
        if(products)
        {
        if(address)
        {
        res.render('checkout1', { products, address,UserData })
        }else{
            res.render('checkout1',{
                UserData,
                products,
                address:0

            })
        }
    }else{
        res.redirect('/cart')
    }

    } catch (err) {
       next(err)
    }
}



// const addAddressForCheckout = async (req, res, next) => {
//     try {
//         const userId = req.session.user_id;
//         const address = await Address.find({ user_id: userId });

//         if (address) {
//             await Address.updateOne(
//                 { user_id: userId },
//                 {
//                     $push: {
//                         address: {
//                             fname: req.body.fname,
//                             lname: req.body.lname,
//                             mobile: req.body.mobile,
//                             email: req.body.email,
//                             housename: req.body.housename,
//                             pin: req.body.pin,
//                             city: req.body.city,
//                             district: req.body.district,
//                             state: req.body.state,
//                         },
//                     },
//                 }
//             );
//         } else {
//             const newAddress = new Address({
//                 user_id: userId,
//                 address: [
//                     {
//                         fname: req.body.fname,
//                         lname: req.body.lname,
//                         mobile: req.body.mobile,
//                         email: req.body.email,
//                         housename: req.body.housename,
//                         pin: req.body.pin,
//                         city: req.body.city,
//                         district: req.body.district,
//                         state: req.body.state,
//                     },
//                 ],
//             });
//             await newAddress.save();
//         }

//         // Redirect to the checkout page
//         res.redirect('/checkout');
//     } catch (err) {
//         next(err);
//     }
// };

const useThisAddress = async (req, res) => {
    try{
    const userId = req.session.user_id
    let userAddress = await Address.findOne({ user_id: userId});
    const products = await Cart.findOne({ user_id:userId }).populate(
        "items.product_Id"
    );
    
    

        if (userAddress) {
            const selectedAddress = userAddress.address.find(
                (address) => address._id.toString() === req.body.address.toString()
            );
            if(selectedAddress)
            {
            res.render('checkout3', {user:userId,address:selectedAddress,products:products});
            }
        } else {
            res.redirect('/checkout')
        }
    } catch (error) {
        console.error('Error fetching selected address:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


//  const selectPayment = async(req,res)=>{
//     try{
        
//         const user_id = req.session.user_id

//         let payment = req.body.paymentMethod === 'COD' 

//         const userAddress = await Address.findOne({user_id:req.session.user_id})
//         const selectedAddress = userAddress.address.find((address) => {
//             return address._id.toString() === req.body.address.toString()
//         });

//         const cartDetails = await Cart.find({user_id:user_id}).populate("items.product_Id")

//         if (cartDetails) {
        
//         res.render("checkout4", {
        
//           address: selectedAddress,
//           user: req.session.user_id,
//           payment,
//           cartItems: cartDetails,
//           // deliveryDate,
//         });
//       }else{
//         res.redirect('/checkout3')
//       }

//     }
//     catch(error)
//     {
//         console.log(error.message)
//     }
//  }

const selectPayment = async (req, res) => {
    try {
      const user_id = req.session.user_id;
      const payment = req.body.paymentMethod === 'COD';
        const product1 =  await Cart.findOne({ user_id:user_id }).populate(
            "items.product_Id"
        );
      // Fetch the selected address
      const userAddress = await Address.findOne({ user_id: req.session.user_id });
      const selectedAddress = userAddress.address.find((address) => {
        return address._id.toString() === req.body.address.toString();
      });
  
      // Fetch the user's cart details and populate the product information
      const cartDetails = await Cart.findOne({ user_id: user_id }).populate({
        path: 'items.product_Id',
        model: 'product', // Assuming the model name for products is 'product'
      });
  
      if (cartDetails) {
        // Render the "checkout4" template with the fetched data
        res.render("checkout4", {
          address: selectedAddress,
          user: req.session.user_id,
          payment,
          cartItems: cartDetails.items,
          prod:product1 // Use cartDetails.items as it contains the populated product information
          // deliveryDate,
        });
      } else {
        res.redirect('/checkout3');
      }
    } catch (error) {
      console.error(error);
      // Handle the error appropriately, e.g., send an error response to the client
    }
  };
  


module.exports = {
    loadCheckout,
    useThisAddress,
    selectPayment
    
    // addAddressForCheckout
}
