const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")



const loadCart = async(req,res)=>{
    try{
        const user_id = req.session.user_id
        console.log(user_id)
        const products = await Cart.findOne({user_id:user_id}).populate('items.product_Id')
        res.render('cart7',{products})
    }
    catch(error)
    {
        console.log(error.message);
    }
}

const addCart = async (req, res,next) => {
    try {
        const userid = req.session.user_id
        let quantity = parseInt(req.body.product_quantity)
        if (isNaN(quantity) || quantity <= 0) {
            // Set a default quantity, e.g., 1
            quantity = 1;
        }
        console.log(quantity)
        const product_Id = req.body.product_Id
        console.log(product_Id)
        const promises = [await Cart.findOne({ user_id: userid }),
        await Product.findOne({ _id: product_Id })]
        const result = await Promise.all(promises)
        const cartdata = result[0]
        const productData = result[1]
        const total = quantity * productData.price
        console.log(total)
        if (cartdata) {
            const findProduct = await Cart.findOne({
                user_id: userid,
                "items.product_Id": new mongoose.Types.ObjectId(product_Id),
            });
            if (findProduct) {
                const cartProduct = cartdata.items.find(
                    (product) => product.product_Id.toString() === product_Id
                );
                if (cartProduct.quantity < productData.stock) {
                    await Cart.findOneAndUpdate({
                        user_id: userid,
                        'items.product_Id': new mongoose.Types.ObjectId(product_Id)
                    }, {
                        $inc: {
                            'items.$.quantity': quantity,
                            'items.$.total': total,
                            totalPrice: total
                        }
                    }
                    )
                    res.json({ count: 'ADDED' });
                }else{
                    res.json({ limit: "limit exceeded" });
                }
            } else {
                await Cart.updateOne(
                    { user_id: userid },
                    {
                        $push: {
                            items: {
                                product_Id: new mongoose.Types.ObjectId(product_Id),
                                quantity: quantity,
                                total: total,
                                price: productData.price
                            },
                        },
                        $inc: { count: 1, totalPrice: total },
                    }
                );
                res.json({ count:'ADDED'});
            }
        }
        else {
            const NewCart = new Cart({
                user_id: userid,
                items: [{
                    product_Id: new mongoose.Types.ObjectId(product_Id),
                    quantity: quantity,
                    total: total,
                    price: productData.price
                }],
                totalPrice: total,
                count: 1
            })

            const data = await NewCart.save()

        }
    }
    catch (err) {
       next(err)
    }
}

// const addCart = async (req, res, next) => {
//     try {
//         const user_id = req.session.user_id;
//         const quantity = parseInt(req.body.product_quantity);
//         const product_Id = req.body.product_Id;

//         // Validate input (e.g., check if quantity is a valid number)

//         const [cart, product] = await Promise.all([
//             Cart.findOne({ user_id: user_id }),
//             Product.findOne({ _id: product_Id }),
//         ]);

//         if (!product) {
//             return res.json({ error: 'Product not found' });
//         }

//         const total = quantity * product.price;

//         if (cart) {
//             const existingProduct = cart.items.find(item =>
//                 item.product_Id.equals(product._id)
//             );

//             if (existingProduct) {
//                 if (existingProduct.quantity + quantity <= product.stock) {
//                     // Update the existing product in the cart
//                     existingProduct.quantity += quantity;
//                     existingProduct.total += total;
//                 } else {
//                     return res.json({ error: 'Quantity exceeds stock limit' });
//                 }
//             } else {
//                 // Add the product to the cart
//                 cart.items.push({
//                     product_Id: product._id,
//                     quantity: quantity,
//                     total: total,
//                     price: product.price,
//                 });
//             }

//             // Update cart totals
//             cart.totalPrice += total;
//             cart.count += quantity;

//             await cart.save();
//         } else {
//             // Create a new cart
//             const newCart = new Cart({
//                 user_id: user_id,
//                 items: [{
//                     product_Id: product._id,
//                     quantity: quantity,
//                     total: total,
//                     price: product.price,
//                 }],
//                 totalPrice: total,
//                 count: quantity,
//             });

//             await newCart.save();
//         }

//         res.json({ success: 'Added to cart' });
//     } catch (error) {
//         next(error);
//     }
// }


// const updateCart = async (req, res, next) => {
//     try {
//         const userid = req.session.user_id; // Change to your session user ID
//         const quantityChange = parseInt(req.body.count); // Change to your request body parameter name
//         const product_Id = req.body.product_Id; // Change to your request body parameter name

//         if (isNaN(quantityChange)) {
//             res.json({ success: false, message: 'Invalid quantity change value' });
//             return;
//         }

//         // Fetch user's cart and the product data
//         const promises = [
//             Cart.findOne({ user_id: userid }),
//             Product.findOne({ _id: product_Id })
//         ];
//         const result = await Promise.all(promises);
//         const cartData = result[0];
//         const productData = result[1];

//         if (!cartData) {
//             res.json({ success: false, message: 'Cart not found for the user' });
//             return;
//         }

//         const cartProduct = cartData.items.find(
//             (product) => product.product_Id.toString() === product_Id
//         );

//         if (!cartProduct) {
//             res.json({ success: false, message: 'Product not found in the cart' });
//             return;
//         }

//         const newQuantity = cartProduct.quantity + quantityChange;

//         if (newQuantity <= 0) {
//             res.json({ success: false, message: 'Cannot have a quantity less than 1' });
//             return;
//         }

//         if (newQuantity > productData.stock) {
//             res.json({ success: false, message: `The maximum quantity available for this product is ${productData.stock}` });
//             return;
//         }

//         const newTotal = newQuantity * productData.price;

//         // Update the cart item with the new quantity and total
//         await Cart.findOneAndUpdate(
//             {
//                 user_id: userid,
//                 'items.product_Id': new mongoose.Types.ObjectId(product_Id)
//             },
//             {
//                 $set: {
//                     'items.$.quantity': newQuantity,
//                     'items.$.total': newTotal
//                 },
//                 $inc: {
//                     totalPrice: newTotal
//                 }
//             }
//         );

//         res.json({ success: true, message: 'Quantity updated successfully' });
//     } catch (err) {
//         next(err);
//     }
// };

// const updateCart = async (req, res, next) => {
//     try {
//         const userid = req.session.user_id;
//         const quantityChange = parseInt(req.body.count);
//         const product_Id = req.body.product_Id;

//         if (isNaN(quantityChange) || !product_Id) {
//             return res.status(400).json({ success: false, message: 'Invalid input' });
//         }

//         const promises = [
//             Cart.findOne({ user_id: userid }),
//             Product.findOne({ _id: product_Id })
//         ];
//         const result = await Promise.all(promises);
//         const cartData = result[0];
//         const productData = result[1];

//         if (!cartData || !productData) {
//             return res.status(404).json({ success: false, message: 'Cart or product not found' });
//         }

//         // Your logic for updating the cart

//         res.json({ success: true, message: 'Quantity updated successfully' });
//     } catch (err) {
//         next(err);
//     }
// };

// const updateCart = async (req, res, next) => {
//     try {
//         const userid = req.session.user_id; // Change to your session user ID
//         const quantityChange = parseInt(req.body.quantity); // Change to your request body parameter name
//         const product_Id = req.body.product_Id; // Change to your request body parameter name
//         console.log(quantityChange)
//         if (isNaN(quantityChange)) {
//             res.json({ success: false, message: 'Invalid quantity change value' });
//             return;
//         }

//         // Fetch user's cart and the product data
//         const promises = [
//             Cart.findOne({ user_id: userid }),
//             Product.findOne({ _id: product_Id })
//         ];
//         const result = await Promise.all(promises);
//         const cartData = result[0];
//         const productData = result[1];

//         if (!cartData) {
//             res.json({ success: false, message: 'Cart not found for the user' });
//             return;
//         }

//         const cartProduct = cartData.items.find(
//             (product) => product.product_Id.toString() === product_Id
//         );

//         if (!cartProduct) {
//             res.json({ success: false, message: 'Product not found in the cart' });
//             return;
//         }

//         const newQuantity = cartProduct.quantity + quantityChange;

//         if (newQuantity <= 0) {
//             res.json({ success: false, message: 'Cannot have a quantity less than 1' });
//             return;
//         }

//         if (newQuantity > productData.stock) {
//             res.json({ success: false, message: `The maximum quantity available for this product is ${productData.stock}` });
//             return;
//         }

//         const newTotal = newQuantity * productData.price;

//         // Update the cart item with the new quantity and total
//         await Cart.findOneAndUpdate(
//             {
//                 user_id: userid,
//                 'items.product_Id': new mongoose.Types.ObjectId(product_Id)
//             },
//             {
//                 $set: {
//                     'items.$.quantity': newQuantity,
//                     'items.$.total': newTotal
//                 },
//                 $inc: {
//                     totalPrice: newTotal
//                 }
//             }
//         );

//         res.json({ success: true, message: 'Quantity updated successfully' });
//     } catch (err) {
//         next(err);
//     }
// };

const updateCart = async (req, res) => {
    try {
        let count = 1
        const productId =req.body.product_Id

        if (typeof count !== 'number' || typeof productId !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid request data.' });
        }

        const cart = await Cart.findOne({ user_id: req.session.user_id });
        const product = await Product.findOne({ _id: productId });

        const cartProduct = cart.items.find(product => product.product_Id.toString() === productId);

        switch (count) {
            case 1:
                if (cartProduct.quantity < product.stock) {
                    cartProduct.quantity++;
                    cartProduct.total += product.price;
                    cart.totalPrice += product.price;
                } else {
                    return res.json({ success: false, message: `The maximum quantity available for this product is ${product.stock}. Please adjust your quantity.` });
                }
                break;
            case -1:
                if (cartProduct.quantity > 1) {
                    cartProduct.quantity--;
                    cartProduct.total -= product.price;
                    cart.totalPrice -= product.price;
                } else {
                    return res.json({ success: false, message: 'Cannot decrement the quantity anymore' });
                }
                break;
            default:
                return res.json({ success: false, message: 'Invalid count value' });
        }

        await cart.save();

        res.json({ success: true, updatedCart: cart });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'An error occurred while updating the cart.' });
    }
};


module.exports={
    loadCart,
    addCart,
    updateCart
}

// const mongoose = require('mongoose');
// const Cart = require('../models/cartModel');
// const Product = require('../models/productModel');

// const loadCart = async (req, res) => {
//     try {
//         const user_id = req.session.user_id;
//         const products = await Cart.findOne({ user_id: user_id }).populate('items.product_Id');
//         res.render('cart6', { products });
//     } catch (error) {
//         console.log(error.message);
//     }
// }

// const addCart = async (req, res, next) => {
//     try {
//         const userid = req.session.user_id;
//         let quantity = parseInt(req.body.product_quantity);
//         if (isNaN(quantity) || quantity <= 0) {
//             // Set a default quantity, e.g., 1
//             quantity = 1;
//         }
//         const product_Id = req.body.product_Id;

//         const promises = [
//             Cart.findOne({ user_id: userid }),
//             Product.findOne({ _id: product_Id })
//         ];
//         const result = await Promise.all(promises);
//         const cartdata = result[0];
//         const productData = result[1];
//         const total = quantity * productData.price;

//         if (cartdata) {
//             const findProduct = await Cart.findOne({
//                 user_id: userid,
//                 "items.product_Id": new mongoose.Types.ObjectId(product_Id),
//             });
//             if (findProduct) {
//                 const cartProduct = cartdata.items.find(
//                     (product) => product.product_Id.toString() === product_Id
//                 );
//                 if (cartProduct.quantity < productData.stock) {
//                     await Cart.findOneAndUpdate({
//                         user_id: userid,
//                         'items.product_Id': new mongoose.Types.ObjectId(product_Id)
//                     }, {
//                         $inc: {
//                             'items.$.quantity': quantity,
//                             'items.$.total': total,
//                             totalPrice: total
//                         }
//                     });
//                     res.json({ count: 'ADDED' });
//                 } else {
//                     res.json({ limit: "limit exceeded" });
//                 }
//             } else {
//                 await Cart.updateOne(
//                     { user_id: userid },
//                     {
//                         $push: {
//                             items: {
//                                 product_Id: new mongoose.Types.ObjectId(product_Id),
//                                 quantity: quantity,
//                                 total: total,
//                                 price: productData.price
//                             },
//                         },
//                         $inc: { count: 1, totalPrice: total },
//                     }
//                 );
//                 res.json({ count: 'ADDED' });
//             }
//         } else {
//             const NewCart = new Cart({
//                 user_id: userid,
//                 items: [{
//                     product_Id: new mongoose.Types.ObjectId(product_Id),
//                     quantity: quantity,
//                     total: total,
//                     price: productData.price
//                 }],
//                 totalPrice: total,
//                 count: 1
//             })

//             await NewCart.save();
//             res.json({ count: 'ADDED' });
//         }
//     } catch (err) {
//         next(err);
//     }
// }

// // const updateCart = async (req, res, next) => {
// //     try {
// //         const userid = req.session.user_id;
// //         const quantityChange = parseInt(req.body.total);
// //         const product_Id = req.body.product_Id;
// //         console.log(quantityChange);

// //         if (isNaN(quantityChange)) {
// //             res.json({ success: false, message: 'Invalid quantity change value' });
// //             return;
// //         }

// //         const promises = [
// //             Cart.findOne({ user_id: userid }),
// //             Product.findOne({ _id: product_Id })
// //         ];
// //         const result = await Promise.all(promises);
// //         const cartData = result[0];
// //         const productData = result[1];

// //         if (!cartData) {
// //             res.json({ success: false, message: 'Cart not found for the user' });
// //             return;
// //         }

// //         const cartProduct = cartData.items.find(
// //             (product) => product.product_Id.toString() === product_Id
// //         );

// //         if (!cartProduct) {
// //             res.json({ success: false, message: 'Product not found in the cart' });
// //             return;
// //         }

// //         const newQuantity = cartProduct.quantity + quantityChange;

// //         if (newQuantity <= 0) {
// //             res.json({ success: false, message: 'Cannot have a quantity less than 1' });
// //             return;
// //         }

// //         if (newQuantity > productData.stock) {
// //             res.json({ success: false, message: `The maximum quantity available for this product is ${productData.stock}` });
// //             return;
// //         }

// //         const newTotal = newQuantity * productData.price;

// //         await Cart.findOneAndUpdate(
// //             {
// //                 user_id: userid,
// //                 'items.product_Id': new mongoose.Types.ObjectId(product_Id)
// //             },
// //             {
// //                 $set: {
// //                     'items.$.quantity': newQuantity,
// //                     'items.$.total': newTotal
// //                 },
// //                 $inc: {
// //                     totalPrice: newTotal
// //                 }
// //             }
// //         );

// //         res.json({ success: true, message: 'Quantity updated successfully' });
// //     } catch (err) {
// //         next(err);
// //     }
// // };

// const updateCart = async (req, res) => {
//     try {
//         const userid = req.session.user_id;
//         const product_Id = req.body.product_Id;
//         const count = parseInt(req.body.count);
//         const currentQuantity = parseInt(req.body.currentQuantity);

//         if (isNaN(count) || isNaN(currentQuantity) || count < 0) {
//             return res.json({ success: false, message: 'Invalid input' });
//         }

//         const cart = await Cart.findOne({ user_id: userid });

//         if (!cart) {
//             return res.json({ success: false, message: 'Cart not found for the user' });
//         }

//         const cartProduct = cart.items.find(
//             (product) => product.product_Id.toString() === product_Id
//         );

//         if (!cartProduct) {
//             return res.json({ success: false, message: 'Product not found in the cart' });
//         }

//         // Calculate the new quantity and total
//         const newQuantity = currentQuantity + count;
//         const productData = await Product.findOne({ _id: product_Id });

//         if (newQuantity <= 0 || newQuantity > productData.stock) {
//             return res.json({ success: false, message: 'Invalid quantity' });
//         }

//         const newTotal = newQuantity * productData.price;

//         // Update the cart item with the new quantity and total
//         const index = cart.items.findIndex(item => item.product_Id.toString() === product_Id);
//         cart.items[index].quantity = newQuantity;
//         cart.items[index].total = newTotal;

//         // Calculate the new cart total
//         cart.totalPrice = cart.items.reduce((total, item) => total + item.total, 0);

//         await cart.save();

//         return res.json({ success: true, message: 'Quantity updated successfully', value: cart });
//     } catch (err) {
//         return res.json({ success: false, message: 'An error occurred', error: err });
//     }
// };

// module.exports = {
//     loadCart,
//     addCart,
//     updateCart
// };
