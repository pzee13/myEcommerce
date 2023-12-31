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

const loadWishlist = async (req, res,next) => {
    try {
        const user_id = req.session.user_id;
        const userId = req.session.user_id 
     

        // Find the user's wishlist and populate the products
        const wishlist = await Wishlist.find({ user_id }).populate('products');

        if (wishlist.length === 0) {
            // Wishlist is empty, return an empty array
            res.render('wishlist3', { data: [] });
       
        } else {
            res.render('wishlist3', { data: wishlist });
        }
    } catch (error) {
        
        next(error);
    }
};



const addToWishlist = async (req, res,next) => {
    try {
        const user_id = req.session.user_id;
        const productId = req.query.id;
      
        // Find the user's wishlist
        const userWishlist = await Wishlist.findOne({ user_id });

        if (userWishlist) {
            // Check if the product is already in the wishlist
            if (userWishlist.products.includes(productId)) {
                return res.json({ success: false, message: 'Product is already in the wishlist' });
            }

            // Add the product to the wishlist
            userWishlist.products.push(productId);
            await userWishlist.save();
        } else {
            // If the user doesn't have a wishlist, create one
            const newWishlist = new Wishlist({
                user_id,
                products: [productId],
            });
            await newWishlist.save();
        }
        const newestWishlist = await Wishlist.findOne({ user_id });
        return res.json({ success: true, message: 'Product added to the wishlist successfully' ,count:newestWishlist.products.length});
    } catch (error) {
      
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const removeFromWishlist = async (req, res,next) => {
    try {
        const user_id = req.session.user_id;
        const productId = req.query.id;

        // Find the user's wishlist and remove the product
        const userWishlist = await Wishlist.findOne({ user_id });

        if (userWishlist) {
            const productIndex = userWishlist.products.indexOf(productId);

            if (productIndex !== -1) {
                // Remove the product from the array
                userWishlist.products.splice(productIndex, 1);
                await userWishlist.save();
                const newestWishlist = await Wishlist.findOne({ user_id });
                return res.json({ success: true, message: 'Product removed from the wishlist successfully',count:newestWishlist.products.length});
            }
        }
     
        return res.json({ success: false, message: 'Product not found in the wishlist' });
    } catch (error) {
   
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};



module.exports ={
    loadWishlist,
    addToWishlist,
    removeFromWishlist
    
}



