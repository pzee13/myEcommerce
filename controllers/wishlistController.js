const mongoose = require('mongoose');
const Wishlist = require('../models/wishlistModel')
const Product = require("../models/productModel")

const loadWishlist = async (req, res) => {
    try {
        const user_id = req.session.user_id;

        // Find the user's wishlist and populate the products
        const wishlist = await Wishlist.find({ user_id }).populate('products');

        if (wishlist.length === 0) {
            // Wishlist is empty, return an empty array
            res.render('wishlist3', { data: [] });
            console.log(wishlist)
        } else {
            res.render('wishlist3', { data: wishlist });
        }
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal server error');
    }
};

// const addToWishlist = async (req, res) => {
//     try {
//         const productId = req.query.id; 
//         // Check if the product is already in the wishlist
//         const existingWishlistItem = await Wishlist.findOne({ product: productId });

//         if (existingWishlistItem) {
//             // If the product is already in the wishlist, return a message
//             res.json({ success: false, message: 'Product is already in the wishlist' });
//         } else {
//             // Create a new wishlist item
//             const newWishlistItem = new Wishlist({ product: productId });
//             await newWishlistItem.save();
            
//             res.json({ success: true, message: 'Product added to the wishlist successfully' });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

// // const removeFromWishlist = async (req, res) => {
// //     try {
// //         const productId = req.query.id;

// //         // Find and delete the wishlist item with the specified product ID
// //         const deletedItem = await Wishlist.findOneAndDelete({ product: productId });

// //         if (deletedItem) {
// //             res.json({ success: true, message: 'Product removed from the wishlist successfully' });
// //         } else {
// //             res.json({ success: false, message: 'Product not found in the wishlist' });
// //         }
// //     } catch (error) {
// //         console.error(error);
// //         res.status(500).json({ success: false, message: 'Internal server error' });
// //     }
// // };

// const removeFromWishlist = async (req, res) => {
//     try {
//         const productId = req.body.id; // Use req.body.id to get the product ID

//         // Find and delete the wishlist item with the specified product ID
//         const deletedItem = await Wishlist.findOneAndDelete({ product: productId });

//         if (deletedItem) {
//             res.json({ success: true, message: 'Product removed from the wishlist successfully' });
//         } else {
//             res.json({ success: false, message: 'Product not found in the wishlist' });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };


// const addToWishlist = async (req, res) => {
//     try {
//         const user_id = req.session.user_id;
//         const productId = req.query.id;

//         // Check if the product is already in the user's wishlist
//         const existingWishlistItem = await Wishlist.findOne({ user_id: user_id, product: productId });

//         if (existingWishlistItem) {
//             res.json({ success: false, message: 'Product is already in the wishlist' });
//         } else {
//             // Create a new wishlist item for the user
//             const newWishlistItem = new Wishlist({ user_id, product: productId });
//             await newWishlistItem.save();
            
//             res.json({ success: true, message: 'Product added to the wishlist successfully' });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

// const removeFromWishlist = async (req, res) => {
//     try {
//         const user_id = req.session.user_id;
//         const productId = req.body.id;

//         // Find and delete the wishlist item for the specified user and product ID
//         const deletedItem = await Wishlist.findOneAndDelete({ user_id: user_id, product: productId });

//         if (deletedItem) {
//             res.json({ success: true, message: 'Product removed from the wishlist successfully' });
//         } else {
//             res.json({ success: false, message: 'Product not found in the wishlist' });
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

// const addToWishlist = async (req, res) => {
//     try {
//         const user_id = req.session.user_id;
//         const productId = req.query.id;

//         // Check if the product is already in the user's wishlist
//         const existingWishlistItem = await Wishlist.findOne({ user_id, products: productId });

//         if (existingWishlistItem) {
//             return res.json({ success: false, message: 'Product is already in the wishlist' });
//         }

//         // Create a new wishlist item for the user
//         const newWishlistItem = new Wishlist({ user_id, products: [productId] });
//         await newWishlistItem.save();

//         return res.json({ success: true, message: 'Product added to the wishlist successfully' });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

// const removeFromWishlist = async (req, res) => {
//     try {
//         const user_id = req.session.user_id;
//         const productId = req.query.id;

//         // Find and delete the wishlist item for the specified user and product ID
//         const deletedItem = await Wishlist.findOneAndRemove({ user_id, products: productId });

//         if (deletedItem) {
//             return res.json({ success: true, message: 'Product removed from the wishlist successfully' });
//         }

//         return res.json({ success: false, message: 'Product not found in the wishlist' });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

const addToWishlist = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const productId = req.query.id;
        console.log(productId)
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

        return res.json({ success: true, message: 'Product added to the wishlist successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


const removeFromWishlist = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        const productId = req.query.id;
        console.log(productId)
        // Find the user's wishlist and remove the product
        const userWishlist = await Wishlist.findOne({ user_id });

        if (userWishlist) {
            const productIndex = userWishlist.products.indexOf(productId);

            if (productIndex !== -1) {
                // Remove the product from the array
                userWishlist.products.splice(productIndex, 1);
                await userWishlist.save();
                return res.json({ success: true, message: 'Product removed from the wishlist successfully' });
            }
        }

        return res.json({ success: false, message: 'Product not found in the wishlist' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// const updatelist = async(req,res)=>{
//     try {
//         // Fetch and send the updated wishlist data here
//         const user_id = req.session.user_id;
//         const wishlist = await Wishlist.find({ user_id }).populate('products');
//         res.json(wishlist);
//     } catch (error) {
//         console.error(error.message);
//         res.status(500).json({ error: 'Internal server error' });
//     }

// }

module.exports ={
    loadWishlist,
    addToWishlist,
    removeFromWishlist
    // updatelist
}



