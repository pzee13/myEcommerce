const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel")
const Address = require("../models/addressModel")
const Wishlist = require("../models/wishlistModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")

const loadProfile = async (req, res, next) => {
    try {
        if (!req.session.user_id) {
            return res.redirect('/login'); // Redirect to login if user_id is not in the session
        }
        else{
        const id = req.session.user_id;
        
        const user = await User.findById(id);
        const orders = await Order.find({ user: id}).populate({
            path: 'products.product_Id',
            model: 'product', // Replace with your actual product model name
            select: 'productName', // Include the field(s) you want to populate
          }).sort({ orderDate: -1 }).limit(10)
   

        if (user) {
            const address = await Address.findOne({ user_id: id })
           
          
            
            res.render('userProfile', { user, address:address ,order:orders,wallet:user.wallet});
           
        } else {
            res.redirect('/login');
        }
    }
    } catch (error) {
        
        next(error) // Handle any errors by redirecting to the login page
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
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        const userData = await User.findById(userId);

        if (!userData) {
            return res.status(404).send('User not found');
        }

        // Check if a new password is provided and it matches the confirm password
        if (newPassword) {
            // Check if the current password matches the database password
            const isPasswordValid = await bcrypt.compare(currentPassword, userData.password);

            if (isPasswordValid) {
              
                

            // Hash and update the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            userData.password = hashedPassword;
        }
        }

        // Update other user profile fields
        userData.firstName = firstname;
        userData.lastName = lastname;
        userData.email = email;
        userData.mobile = mobile;

        await userData.save();

        res.redirect('/profile#tab-account');
    } catch (err) {
        next(err);
        
    }
};

const isStrongPassword = password => {
    // Define the criteria for a strong password
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password);

    // Check if the password meets all criteria
    return (
        password.length >= minLength &&
        hasUppercase &&
        hasLowercase &&
        hasDigit &&
        hasSpecialChar
    );
};


const changePassword = async (req, res) => {
    try {
        const userId = req.session.user_id;
        const currentPassword = req.body.currentPassword;
        const newPassword = req.body.newPassword;
        const confirmPassword = req.body.confirmPassword;

        // Fetch user data
        const userData = await User.findById(userId);

        if (!userData) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password);

        if (!isCurrentPasswordValid) {
            return res.status(400).json({ success: false, error: 'Current password is incorrect' });
        }

        // Check if the new password meets strong validation criteria on the server-side
        const isStrong = isStrongPassword(newPassword); // Rename the variable
        if (!isStrong) {
            return res.status(400).json({ success: false, error: 'New password does not meet strong criteria' });
        }

        // Check if the new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, error: 'Passwords do not match' });
        }

        // Hash and update the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        userData.password = hashedPassword;

        await userData.save();

        // Password changed successfully
        res.json({ success: true });
    } catch (err) {
        
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}




// const updateProfile = async (req, res, next) => {
//     try {
//         const userId = req.session.user_id;
//         const firstname = req.body.fname;
//         const lastname = req.body.lname;
//         const email = req.body.email;
//         const mobile = req.body.mobile;
//         const currentPassword = req.body.currentPassword;
//         const newPassword = req.body.newPassword;
//         const confirmPassword = req.body.confirmPassword;

//         const userData = await User.findById(userId);

//         if (!userData) {
//             return res.status(404).send('User not found');
//         }

//         // Only validate the current password when changing the password
//         if (newPassword) {
//             // Check if the current password matches the database password
//             const isPasswordValid = await bcrypt.compare(currentPassword, userData.password);

//             if (!isPasswordValid) {
//                 // Passwords do not match; return an error
//                 return res.status(400).send('Current password is incorrect');
//             }

//             // Hash and update the new password
//             const hashedPassword = await bcrypt.hash(newPassword, 10);
//             userData.password = hashedPassword;
//         }

//         // Update other user profile fields
//         userData.firstName = firstname;
//         userData.lastName = lastname;
//         userData.email = email;
//         userData.mobile = mobile;

//         await userData.save();

//         res.json({ success: true, message: "Profile updated successfully" });
//     } catch (err) {
//         // Handle errors and send a JSON response for errors
//         res.status(400).json({ success: false, message: "Error updating profile" });
//     }
// };




const addAddress = async (req,res,next) => {
    try {
        const userId = req.session.user_id; // Assuming you use sessions to identify users

        const newAddress = {
            fname: req.body.fname,
            lname: req.body.lname,
            mobile: req.body.mobile,
            email: req.body.email,
            housename: req.body.housename,
            pin: req.body.pin,
            city: req.body.city,
            district: req.body.district,
            state: req.body.state
        };

        const existingUserAddress = await Address.findOne({ user_id: userId });

        if (existingUserAddress) {
            // Update the existing address
            existingUserAddress.address.push(newAddress);
            await existingUserAddress.save();
        } else {
            // Create a new Address document if it doesn't exist
            const newAddressDocument = new Address({
                user_id: userId,
                address: [newAddress]
            });
            await newAddressDocument.save();
        }

        // Redirect to the profile page or any other suitable page
        res.redirect('/profile#tab-address');
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

        res.redirect('/profile#tab-address');
        
    } catch (err) {
        
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

// const deleteAddress = async (req, res, next) => {
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

const deleteAddress = async (req, res, next) => {
    try {
        const addressId = req.params.addressId;
    
        
        const userId = req.session.user_id;

        const result = await Address.updateOne(
            { user_id: userId },
            { $pull: { address: { _id: addressId } } }
        );
           
           
        if (result.ok === 1) {
            
            return res.status(200).json({ message: 'Address deleted successfully' });
            
        } else {
            return res.status(404).json({ message: 'Address not found' });
        }
   
    } catch (error) {
 
        res.status(500).json({ message: 'Error deleting the address' });
    }
};

const loadWallet = async (req, res, next) => {
    try {
        const userId = req.session.user_id;
        

        const user = await User.aggregate([
            { $match: { _id:new mongoose.Types.ObjectId(userId)} },
            {
                $project: {
                    _id: 1,
                    wallet: 1,
                    walletHistory: {
                        $map: {
                            input: '$walletHistory',
                            as: 'transaction',
                            in: {
                                date: '$$transaction.date',
                                amount: '$$transaction.amount',
                                description: '$$transaction.description',
                            },
                        },
                    },
                },
            },
        ]);

        if (user.length > 0) {
            res.render('wallet', { wallet: user[0].wallet, walletHistory: user[0].walletHistory});
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        
        next(error);
    }
};


module.exports = {
    loadProfile,
    updateProfile,
    addAddress,
    // loadEditAddress,
    EditAddress,
    deleteAddress,
    loadWallet,
    changePassword
}
