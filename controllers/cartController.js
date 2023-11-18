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
        
        if(user_id)
        {
            const products = await Cart.findOne({user_id:user_id}).populate('items.product_Id')

        if (!products) {
        res.render('cart2',{ products: { totalPrice: 0, items: [] },userIsLoggedIn: req.session.user_id ? true : false });
    } else {
        res.render('cart2', { products,userIsLoggedIn: req.session.user_id ? true : false });
    }
}else{
    res.redirect('/login')
}
}
    catch(error)
    {
        console.log(error.message);
    }
}

const addCart = async (req, res, next) => {
    try {
        const userid = req.session.user_id;
        let quantity = parseInt(req.body.data_quantity);
        if(userid){
        if (isNaN(quantity) || quantity <= 0) {
            // Set a default quantity, e.g., 1
            quantity = 1;
        }
        const product_Id = req.body.product_Id;
        console.log('Add to cart called with quantity:', quantity, 'product ID:', req.body.product_Id);
        const promises = [await Cart.findOne({ user_id: userid }),
        await Product.findOne({ _id: product_Id })];
        const result = await Promise.all(promises);
        const cartdata = result[0];
        const productData = result[1];
        let total = 0;
        if(!productData.offer){
        total = quantity * productData.price;
        }else{
           total =  quantity * productData.discountedPrice
        }

        if(!productData.offer){
        if (cartdata) {
            const findProduct = await Cart.findOne({
                user_id: userid,
                "items.product_Id": new mongoose.Types.ObjectId(product_Id),
            });

            if (findProduct) {
                const cartProduct = cartdata.items.find(
                    (product) => product.product_Id.toString() === product_Id
                );

                if (cartProduct.quantity < productData.quantity) {
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
        }}else{
            if (cartdata) {
                const findProduct = await Cart.findOne({
                    user_id: userid,
                    "items.product_Id": new mongoose.Types.ObjectId(product_Id),
                });
    
                if (findProduct) {
                    const cartProduct = cartdata.items.find(
                        (product) => product.product_Id.toString() === product_Id
                    );
    
                    if (cartProduct.quantity < productData.quantity) {
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
                                    price: productData.discountedPrice
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
                        price: productData.discountedPrice
                    }],
                    totalPrice: total,
                    count: 1
                });
    
                await NewCart.save();
    
                res.json({ count: 'ADDED' });
            }
        }
    }
    else{
        res.redirect('/login')
    }
    } catch (err) {
        next(err);
    }
}

// const addCart = async (req, res, next) => {
//     try {
//         const userid = req.session.user_id;
//         const product_Id = req.body.product_Id;
//         const quantity = parseInt(req.body.quantity); // Retrieve the quantity from the request

//         if (isNaN(quantity) || quantity <= 0) {
//             // Handle invalid quantity (e.g., set it to 1 as a default)
//             quantity = 1;
//         }

//         // Query the cart for the user
//         const cart = await Cart.findOne({ user_id: userid });

//         if (cart) {
//             // Check if the product is already in the cart
//             const existingProduct = cart.items.find(item => item.product_Id.toString() === product_Id);

//             if (existingProduct) {
//                 // Update the quantity and total price
//                 if (existingProduct.quantity + quantity <= existingProduct.max_quantity) {
//                     existingProduct.quantity += quantity;
//                     existingProduct.total = existingProduct.quantity * existingProduct.price;
//                     cart.totalPrice += quantity * existingProduct.price;
//                     await cart.save();
//                     res.json({ count: 'UPDATED' });
//                 } else {
//                     res.json({ limit: 'Limit exceeded' });
//                 }
//             } else {
//                 // Product is not in the cart, add it
//                 const productData = await Product.findOne({ _id: product_Id });

//                 if (productData) {
//                     if (quantity <= productData.quantity) {
//                         cart.items.push({
//                             product_Id: product_Id,
//                             quantity: quantity,
//                             price: productData.price,
//                             total: quantity * productData.price
//                         });
//                         cart.totalPrice += quantity * productData.price;
//                         await cart.save();
//                         res.json({ count: 'ADDED' });
//                     } else {
//                         res.json({ limit: 'Limit exceeded' });
//                     }
//                 } else {
//                     res.json({ error: 'Product not found' });
//                 }
//             }
//         } else {
//             // Cart doesn't exist, create a new one
//             const productData = await Product.findOne({ _id: product_Id });

//             if (productData) {
//                 if (quantity <= productData.quantity) {
//                     const newCart = new Cart({
//                         user_id: userid,
//                         items: [{
//                             product_Id: product_Id,
//                             quantity: quantity,
//                             price: productData.price,
//                             total: quantity * productData.price
//                         }],
//                         totalPrice: quantity * productData.price
//                     });
//                     await newCart.save();
//                     res.json({ count: 'ADDED' });
//                 } else {
//                     res.json({ limit: 'Limit exceeded' });
//                 }
//             } else {
//                 res.json({ error: 'Product not found' });
//             }
//         }
//     } catch (err) {
//         next(err);
//     }
// }



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

        const productData = await Product.findOne({_id:product_Id})
       
        const productQuantity = productData.quantity
       

        // Calculate new quantity and total
        const newQuantity = cartItem.quantity + quantityChange;
        console.log(newQuantity)
        if (newQuantity < 1) {
            return res.status(400).json({ success: false, message: 'Quantity cannot be less than 1' });
        }else if(newQuantity >= productQuantity){
            return res.status(400).json({ success: false, message: 'Product stock exceeded' });
        } else if( newQuantity > 10){
            return res.status(400).json({ success: false, message: 'Only 10 items can be purchased'});
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



// Function to update the cart when the "Update Cart" button is clicked
// const updateCart = async (req, res) => {
//     const user_id = req.session.user_id;

//     try {
//         const cart = await Cart.findOne({ user_id: user_id });
//         if (!cart) {
//             return res.json({ success: false, message: 'Cart not found' });
//         }

//         // Add your logic to update the cart total based on the items in the cart

//         // After updating, send a response with the updated cart
//         res.json({ success: true, message: 'Cart updated successfully', cart });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// };

const updateCart = async (req, res) => {
    const user_id = req.session.user_id;

    try {
        // Retrieve the user's cart
        const cart = await Cart.findOne({ user_id: user_id });

        if (!cart) {
            return res.json({ success: false, message: 'Cart not found' });
        }

        // Calculate the updated total based on the items in the cart
        const newTotalPrice = cart.items.reduce((total, item) => total + item.total, 0);

        // Update the cart's total price
        cart.totalPrice = newTotalPrice;

        // Save the updated cart
        await cart.save();

        return res.json({ success: true, message: 'Cart updated successfully', cart });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// const cartRemove = async (req, res,next) => {
//     try {
//         const id = req.query.id
//         const userid = req.session.user_id
//         const price = req.query.price

//         console.log(price);
//       await Cart.findOneAndUpdate(
//             { user_id: userid},
//             { $inc: { totalPrice: -price } }
//         );

//         const ab=await Cart.findOneAndUpdate({ user_id: userid }, { $pull: { 'items': { product_Id: id } } })
       
//         if(ab.items.length==1){
//             await Cart.findOneAndDelete({user_id:userid})
//         }
//         res.redirect("/cart")

//     } catch (err) {
//        next(err)
//     }
// }

const cartRemove = async (req, res, next) => {
    try {
        const id = req.query.id;
        const userid = req.session.user_id;
        const price = req.query.price;

        await Cart.findOneAndUpdate(
            { user_id: userid },
            { $inc: { totalPrice: -price } }
        );

        const ab = await Cart.findOneAndUpdate({ user_id: userid }, { $pull: { items: { product_Id: id } } });

        if (ab.items.length === 1) {
            await Cart.findOneAndDelete({ user_id: userid });
        }

        // Return a JSON response to indicate success
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (err) {
        next(err);
    }
};



module.exports ={
    loadCart,
    addCart,
    updateQuantity,
    updateCart,
    cartRemove
    
   
}


