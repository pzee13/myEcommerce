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


// const updateProfile = async (req, res, next) => {
//     try {
//         const firstname = req.body.fname;
//         const lastname = req.body.lname;
//         const email = req.body.email;
//         const mobile = req.body.mobile;
//         const password = req.body.password; // Assuming you want to change the password
        
//         // Ensure you hash the new password if provided (you should validate it first)
//         if (password) {
//             const hashedPassword = await bcrypt.hash(password, 10);
//             await User.findByIdAndUpdate(req.session.user_id, {
//                 firstName: firstname,
//                 lastName: lastname,
//                 email: email,
//                 mobile: mobile,
//                 password: hashedPassword, // Update password if provided
//             });
//         } else {
//             await User.findByIdAndUpdate(req.session.user_id, {
//                 firstName: firstname,
//                 lastName: lastname,
//                 email: email,
//                 mobile: mobile,
//             });
//         }
        
//         res.redirect('/profile');
//     } catch (err) {
//         next(err);
//     }
// };

// const updateProfile = async (req, res, next) => {
//     try {
//         const firstname = req.body.fname;
//         const lastname = req.body.lname;
//         const email = req.body.email;
//         const mobile = req.body.mobile;
//         const password = req.body.password; // New password if provided

//         // Find the user by their session ID
//         const user = await User.findById(req.session.user_id);

//         if (!user) {
//             return res.status(404).send('User not found');
//         }

//         // Update only the fields that are provided in the request
//         user.firstName = firstname;
//         user.lastName = lastname;
//         user.email = email;
//         user.mobile = mobile;

//         // Update the password if a new one is provided
//         if (password) {
//             const hashedPassword = await bcrypt.hash(password, 10);
//             user.password = hashedPassword;
//         }

//         // Save the updated user
//         await user.save();

//         res.redirect('/profile');
//     } catch (err) {
//         next(err);
//     }
// };

const updateProfile = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        const firstname = req.body.fname;
        const lastname = req.body.lname;
        const email = req.body.email;
        const mobile = req.body.mobile;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        const userData = await User.findById(userId);

        if (!userData) {
            return res.status(404).send('User not found');
        }

        // Check if a new password is provided and it matches the confirm password
        if (newPassword && newPassword === confirmPassword) {
            // Hash and update the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            userData.password = hashedPassword;
        }

        // Update other user profile fields
        userData.firstName = firstname;
        userData.lastName = lastname;
        userData.email = email;
        userData.mobile = mobile;

        await userData.save();

        res.redirect('/profile');
    } catch (err) {
        next(err);
    }
};



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

// const deleteAddress = async(req,res)=>{
//     try{
//         const addressId = req.params.addressId;

//         // Check if the address exists
//         const address = await Address.findById(addressId);

//         if (!address) {
//             return res.status(404).json({ message: 'Address not found' });
//         }

//         // Delete the address
//         await Address.findByIdAndDelete(addressId);

//         res.status(200).json({ message: 'Address deleted successfully' });
//     }
//     catch(error)
//     {
//         console.log(error.message)
//     }
// }

// const deleteAddress = async (req, res) => {
//     try {
//         const addressId = req.params.addressId;
//         console.log(addressId)
//         // Check if the address exists
//         const address = await Address.findById(addressId);
//         console.log(address);

//         if (!address) {
//             return res.status(404).json({ message: 'Address not found' });
//         }
//         else{
//         // Delete the address
//         await Address.findByIdAndDelete(addressId);

//         res.status(200).json({ message: 'Address deleted successfully' });
//         }
//     } catch (error) {
//         console.error('An error occurred while deleting the address', error);
//         res.status(500).json({ message: 'Error deleting the address' });
//     }
// };

const deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.addressId;
        console.log(addressId);
        
        const userId = req.session.user_id;

        const result = await Address.updateOne(
            { user_id: userId },
            { $pull: { address: { _id: addressId } } }
        );
            console.log(result)
        if (result.ok === 1) {
            return res.status(200).json({ message: 'Address deleted successfully' });
        } else {
            return res.status(404).json({ message: 'Address not found' });
        }
    } catch (error) {
        console.error('An error occurred while deleting the address', error);
        res.status(500).json({ message: 'Error deleting the address' });
    }
};



module.exports = {
    loadProfile,
    updateProfile,
    addAddress,
    // loadEditAddress,
    EditAddress,
    deleteAddress
}
