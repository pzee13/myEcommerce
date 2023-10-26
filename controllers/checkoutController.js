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
        const address = await Address.findOne({ user_id:id })


        res.render('checkout', { products, address,UserData })

    } catch (err) {
       next(err)
    }
}

module.exports = {
    loadCheckout
}
