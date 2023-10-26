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

const loadProfile = async (req, res) => {
    try {
        if (!req.session.user_id) {
            return res.redirect('/login'); // Redirect to login if user_id is not in the session
        }
        else{
        const id = req.session.user_id;
        const user = await User.findById(id);

        if (user) {
            const address = await Address.findOne({ user_id: id })
           
            res.render('userProfile', { user, address:address });
        } else {
            res.redirect('/login');
        }
    }
    } catch (error) {
        console.log(error.message);
        res.redirect('/login'); // Handle any errors by redirecting to the login page
    }
} 

const addAddress = async (req,res,next) => {
    try {

        const userId = req.session.user_id;

        const address = await Address.find({ user_id: userId });

        if (address) {
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
                            state: req.body.state
                            
                        }
                    }
                }
            );
        } else {
            const newAddress = new Address({
                user_id: userId,
                address: [{
                            fname: req.body.fname,
                            lname: req.body.lname,
                            mobile: req.body.mobile,
                            email: req.body.email,
                            housename: req.body.housename,
                            pin: req.body.pin,
                            city: req.body.city,
                            district: req.body.district,
                            state: req.body.state
                }]
            });
            await newAddress.save();
        }

        res.redirect('/profile');
    } catch (err) {
       next(err);
    }
}

// const loadEditAddress=async(req,res,next)=>{
//     try {
//         const address_id=req.body.id
//         console.log(address_id)
//         const id = req.session.userid

//         const addressdata = await Address.findOne({ user_id: id }, { address: { $elemMatch: { _id: address_id } } });
//         res.render('editAddressModal', { address: addressdata.address[0]})
    
//     } catch (err) {
//         next(err)
//     }
// }

const EditAddress = async (req, res, next) => {
    try {
        const id = req.body.editAddressId; // Get address ID from hidden field
        console.log(id)
        const userId = req.session.user_id;

        await Address.findOneAndUpdate(
            { user_id: userId, address: { $elemMatch: { _id: id } } },
            {
                $set: {
                    "address.$.fname": req.body.fname,
                    "address.$.sname": req.body.lname,
                    "address.$.mobile": req.body.mobile,
                    "address.$.email": req.body.email,
                    "address.$.housename": req.body.housename,
                    "address.$.city": req.body.city,
                    "address.$.state": req.body.state,
                    "address.$.district": req.body.district,
                    "address.$.pin": req.body.pin
                }
            }
        );

        res.redirect('/profile');
    } catch (err) {
        console.error(err);
        next(err);
    }
};


module.exports = {
    loadProfile,
    addAddress,
    // loadEditAddress,
    EditAddress
}
