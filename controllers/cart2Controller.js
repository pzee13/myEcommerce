const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel");
const User = require("../models/userModels/userModel");
const Cart = require("../models/cartModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const bcrypt = require('bcrypt');
const path = require("path");
const fs = require("fs");

const loadCart = async (req, res) => {
    try {
        const user_id = req.session.user_id;
        console.log(user_id);
        const products = await Cart.findOne({ user_id: user_id }).populate('items.product_Id');

        if (!products) {
            res.render('cart', { products: { totalPrice: 0, items: [] } });
        } else {
            res.render('cart', { products });
        }
    } catch (error) {
        console.log(error.message);
    }
};

const addCart = async (req, res, next) => {
    try {
        const userid = req.session.user_id;
        let quantity = parseInt(req.query.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            // Set a default quantity, e.g., 1
            quantity = 1;
        }
        const product_Id = req.body.product_Id;
        console.log('Add to cart called with quantity:', req.query.quantity, 'product ID:', req.body.product_Id);

        const promises = [await Cart.findOne({ user_id: userid }),
        await Product.findOne({ _id: product_Id })];
        const result = await Promise.all(promises);
        const cartdata = result[0];
        const productData = result[1];
        const total = quantity * productData.price;

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
                            totalPrice: cartdata.totalPrice + total
                        }
                    });

                    res.json({ count: 'ADDED' });
                } else {
                    res.json({ limit: 'Limit exceeded' });
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

                res.json({ count: 'ADDED' });
            }
        } else {
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
            });

            await NewCart.save();

            res.json({ count: 'ADDED' });
        }
    } catch (err) {
        next(err);
    }
};

const updateQuantity = async (req, res) => {
    const user_id = req.session.user_id;
    const product_Id = req.params.id;
    const quantityChange = parseInt(req.params.quantity);
    
    try {
        const cart = await Cart.findOne({ user_id: user_id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const cartItem = cart.items.find(item => item.product_Id.toString() === product_Id);
        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Product not found in the cart' });
        }

        // Calculate new quantity and total
        const newQuantity = cartItem.quantity + quantityChange;
        if (newQuantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity cannot be less than 1' });
        }
        const newTotal = newQuantity * cartItem.price;

        // Update the quantity and total for the cart item
        cartItem.quantity = newQuantity;
        cartItem.total = newTotal;

        // Recalculate the total price of the cart
        cart.totalPrice = cart.items.reduce((total, item) => total + item.total, 0);

        // Save the updated cart
        await cart.save();

        return res.status(200).json({ success: true, message: 'Quantity updated successfully', cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const updateCart = async (req, res) => {
    const user_id = req.session.user_id;

    try {
        const cart = await Cart.findOne({ user_id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        // Recalculate the total price of the cart based on the items
        cart.totalPrice = cart.items.reduce((total, item) => total + item.total, 0);

        // Save the updated cart
        await cart.save();

        return res.status(200).json({ success: true, message: 'Cart updated successfully', cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = { loadCart, addCart, updateQuantity, updateCart };