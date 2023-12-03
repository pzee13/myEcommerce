const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel")
const Coupon =require("../models/couponModel")
const Address = require("../models/addressModel")
const Wishlist = require("../models/wishlistModel")
const Product = require("../models/productModel")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")

const loadCheckout0 = async (req, res,next) => {
  try {
      const id = req.session.user_id;
      const UserData=await User.findById(id)
      const products = await Cart.findOne({ user_id:id }).populate(
          "items.product_Id"
      );
      const address = await Address.findOne({ user_id:id },{address:1})
      let unusedCoupons = [];

      if(products)
      {
      if(address)
      {
        unusedCoupons = await Coupon.find({// Coupons with no associated user ID
          expireDate: { $gt: new Date() } // Coupons that are not expired
        });
      res.render('checkout', { products,address,UserData,unusedCoupons })
      }else{
          res.render('checkout',{
              UserData,
              products,
              address:0,
              unusedCoupons
          })
      }
  }else{
      res.redirect('/cart')
  }

  } catch (err) {
     next(err)
     
  }
}




const addAddressForCheckout = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    let newAddress;

    const address = await Address.find({ user_id: userId });

    if (address.length > 0) {
      await Address.updateOne(
        { user_id: userId },
        {
          $push: {
            address: {
              fname: req.body.fname,
              lname: req.body.lname,
              mobile: req.body.mobile,
              email: req.body.email,
              housename: req.body.housename,
              pin: req.body.pin,
              city: req.body.city,
              district: req.body.district,
              state: req.body.state,
            },
          },
        }
      );
    } else {
      // Include the user_id field when creating a new address
      newAddress = await Address.create({
        user_id: userId,
        address: [
          {
            fname: req.body.fname,
            lname: req.body.lname,
            mobile: req.body.mobile,
            email: req.body.email,
            housename: req.body.housename,
            pin: req.body.pin,
            city: req.body.city,
            district: req.body.district,
            state: req.body.state,
          },
        ],
      });
    }

    // Redirect back to the checkout page after adding the address
    // You can also include a success message if needed
    res.redirect('/checkout');
  } catch (err) {
    // Handle errors and respond with an error message
    next(err); // Log the error for debugging

  }
};




module.exports = {
    loadCheckout0,
    addAddressForCheckout
}
