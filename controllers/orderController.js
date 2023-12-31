const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Cart = require("../models/cartModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Order = require("../models/orderModel")
const Coupon = require("../models/couponModel")
const Razorpay = require("razorpay")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")
const cron = require('node-cron');
const PDFDocument = require('pdfkit')
var crypto = require("crypto");


var instance = new Razorpay({
  key_id: process.env.Razorpay_KEY_ID,
  key_secret: process.env.Razorpay_KEY_SECRET
});


const checkProductQuantities = async (cartItems) => {
  for (const item of cartItems.items) {
    const productId = item.product_Id._id;
    const product = await Product.findById(productId);

    if (!product || item.quantity > product.quantity) {
      return false;
    }
  }
  return true;
};

const placeOrder = async (req, res) => {
  try {
   

    const { addressId, paymentOption } = req.body;
    const userId = req.session.user_id;

    const cartItems = await Cart.findOne({ user_id: userId }).populate({
      path: 'items.product_Id',
      model: 'product',
    });

    const totalAmount1 = cartItems.totalPrice

    const user = await User.findById(userId);

    if (paymentOption === 'Wallet' && user.wallet < totalAmount1) {
      return res.status(400).json({
        success: false,
        insufficientBalance: true, 
        message: 'Wallet balance is insufficient. Please choose another payment option.',
      });
    }


    

    if (!cartItems) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Unable to place an order.',
      });
    }

    const isProductQuantityValid = await checkProductQuantities(cartItems);
    console.log('isProductQuantityValid:', isProductQuantityValid);
    if (!isProductQuantityValid) {
      console.log('Invalid product quantities. Please check your cart.');
      return res.status(400).json({
        success: false,
        InvalidQuantity: true,
        message: 'Invalid product quantities. Please check your cart.',
      });
    }

    const orderDataUser = await Order.find({ user: userId });
    let status = paymentOption == 'COD' ? 'placed' : 'pending'
    function generateOrderID() {
      return Math.floor(Math.random() * 900000) + 100000;
    }

    let orderIdSample;

    if (!orderDataUser[0]) {
      orderIdSample = generateOrderID();
    } else {
      const lastOrder = orderDataUser[orderDataUser.length - 1];
      orderIdSample = lastOrder.orderID + 1;
    }

    const products = cartItems.items.map((item) => ({
      product_Id: item.product_Id,
      total: item.total,
      quantity: item.quantity,
    }));

    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 7);

    let discountTotal = 0;
    let appliedCoupon = null;

    if (req.session.coupon) {
      
      discountTotal = req.session.coupon.discountTotal;
      appliedCoupon = {
        code: req.session.coupon.code,
        discountTotal: req.session.coupon.discountTotal,
        minimumSpend: req.session.coupon.minimumSpend,
        discountPercentage:req.session.coupon.discountPercentage
      };
    }
    const totalAmount = totalAmount1 - discountTotal;

    if(paymentOption==='Wallet' && user.wallet >= totalAmount){
      const userid=req.session.user_id
      await User.findByIdAndUpdate({_id:userid},{$inc:{wallet:-totalAmount},$push: {
        walletHistory: {
          date: new Date(),
          amount: totalAmount,
          description: `Buy product with wallet - Order ${orderIdSample}`,
          transactionType:'Debit'
        },
      },})
      status='placed'
    
     }


    const newOrder = new Order({
      user: userId,
      orderID: orderIdSample,
      deliveryAddress: addressId,
      paymentOption,
      totalAmount,
      orderDate: new Date(),
      expectedDelivery: deliveryDate,
      products: products,
      coupon: appliedCoupon,
    });

    const orderData =await newOrder.save();
    const orderId = newOrder._id;

    if(paymentOption == 'Online')
    {
    
    if (!isProductQuantityValid) {
      console.log('Invalid product quantities. Please check your cart.');
      return res.status(400).json({
        success: false,
        InvalidQuantity: true,
        message: 'Invalid product quantities. Please check your cart.',
      });
    }
    await Order.findOneAndUpdate(
      { _id: orderId },
      { $set: { 'products.$[].status': 'Canceled' ,'products.$[].paymentStatus': 'Failure'} }
      
  );
    }

    if ((status === 'placed' || paymentOption === 'Online') && req.session.coupon && req.session.user_id) {
      await Coupon.findOneAndUpdate(
        { code: req.session.coupon.code },
        { $push: { user: req.session.user_id } }
      );
    }

    if (status == 'placed') {
    
      for (const item of cartItems.items) {
        const productId = item.product_Id._id;
        const quantity = parseInt(item.quantity, 10);
        await Product.findByIdAndUpdate(
          { _id: productId },
          {
            $inc: { quantity: -quantity },
          }
        );
        if(paymentOption == 'Wallet')
        {
          await Order.findOneAndUpdate(
            { _id: orderId },
            { $set: { 'products.$[].paymentStatus': 'Success' } }
        );
        }
        
      }
      res.json({ codSuccess:true})
      await Cart.findOneAndDelete({ user_id: userId });

    } else if (paymentOption === 'Online') {
      
      var options = {
        amount: totalAmount * 100,
        currency: 'INR',
        receipt: "" + orderId
      };

      instance.orders.create(options, function (err, order) {
        if (err) {
          console.error(err); 
         
        } else {
          
          res.json({ order }); 
        }
      });
    }

    
    
  } catch (error) {
    console.error(error);
    if (req.session.coupon && req.session.user_id) {
      await Coupon.findOneAndUpdate({ code: req.session.coupon.code }, { $pull: { user: req.session.user_id } });
    }else{

    }

    res.status(500).json({ success: false, message: 'Failed to place the order' });

  }
};

// Validate Payment Verification Function
const validatePaymentVerification = async (req, res) => {
  try {
    const body = req.body;
    console.log(body)
    const userid = req.session.user_id;
    let hmac = crypto.createHmac("sha256", process.env.Razorpay_KEY_SECRET); 
    hmac.update(
      body.payment.razorpay_order_id +
        "|" +
        body.payment.razorpay_payment_id
    );
    const hmacValue = hmac.digest("hex");

    console.log('Calculated HMAC:', hmacValue);
console.log('Received razorpay_signature:', body.payment.razorpay_signature);

    if (hmacValue === body.payment.razorpay_signature) {
      const items = await Order.findByIdAndUpdate(
        { _id: body.order.receipt },
        { $set: { payment_Id: body.payment.razorpay_payment_id } }
      );

    // const cartItems = await Order.findById({ _id: body.order.receipt }).populate({
    //   path: 'products.product_Id',
    //   model: 'product',
    // });
    //     const isProductQuantityValid = await checkProductQuantities(cartItems);
    //     if (!isProductQuantityValid) {
    //       return res.status(400).json({
    //         success: false,
    //         InvalidQuantity: true,
    //         message: 'Invalid product quantities. Please check your order.',
    //       });
    //     }

      await Order.findByIdAndUpdate(
        { _id: body.order.receipt },
        { $set: { 'products.$[].status': 'Order Placed' } }
      );
      for (let item of items.products) {
        await Product.updateOne(
          { _id: item.product_Id },
          { $inc: { quantity: -item.quantity } }
        );
      }
      await Order.findOneAndUpdate(
        { _id: body.order.receipt },
        { $set: { 'products.$[].paymentStatus': 'Success' } }
    );

      await Cart.deleteOne({ user_id: userid });
      res.json({ success: true });
    } else {
      if (req.session.coupon && req.session.user_id) {
        await Coupon.findOneAndUpdate({ code: req.session.coupon.code }, { $pull: { user: req.session.user_id } });
      }
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



// const validatePaymentVerification = async (req, res) => {
//   try {
//     const body = req.body;
//     console.log(body);
//     const userid = req.session.user_id;
//     let hmac = crypto.createHmac("sha256", process.env.Razorpay_KEY_SECRET); 
//     hmac.update(
//       body.payment.razorpay_order_id +
//         "|" +
//         body.payment.razorpay_payment_id
//     );
//     const hmacValue = hmac.digest("hex");

//     console.log('Calculated HMAC:', hmacValue);
//     console.log('Received razorpay_signature:', body.payment.razorpay_signature);

//     if (hmacValue === body.payment.razorpay_signature) {
//       const order = await Order.findByIdAndUpdate(
//         { _id: body.order.receipt },
//         { $set: { payment_Id: body.payment.razorpay_payment_id } }
//       );

//       const isProductQuantityValid = await checkProductQuantities(order.products);
//       if (!isProductQuantityValid) {
//         return res.status(400).json({
//           success: false,
//           InvalidQuantity: true,
//           message: 'Invalid product quantities. Please check your order.',
//         });
//       }

//       await Order.findByIdAndUpdate(
//         { _id: body.order.receipt },
//         { $set: { 'products.$[].status': 'Order Placed' } }
//       );

//       for (let item of order.products) {
//         await Product.updateOne(
//           { _id: item.product_Id },
//           { $inc: { quantity: -item.quantity } }
//         );
//       }

//       await Order.findOneAndUpdate(
//         { _id: body.order.receipt },
//         { $set: { 'products.$[].paymentStatus': 'Success' } }
//       );

//       await Cart.deleteOne({ user_id: userid });
//       res.json({ success: true });
//     } else {
//       if (req.session.coupon && req.session.user_id) {
//         await Coupon.findOneAndUpdate({ code: req.session.coupon.code }, { $pull: { user: req.session.user_id } });
//       }else{

//       }
//       res.status(400).json({ success: false, message: 'Payment verification failed' });
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// };



const loadOrderPlaced = async (req, res, next) => {
  try{
  const userId = req.session.user_id;
  const orderId = req.query.id;

  let order; 

  if (orderId) {
      order = await Order.findOne({ _id: orderId })
          .populate({
              path: 'products.product_Id',
          })
          .sort({ orderDate: -1 });
  } else {
      order = await Order.findOne({ user: userId })
          .populate({
              path: 'products.product_Id',
          })
          .sort({ orderDate: -1 });
  }

  

  if (!order) {
      return res.status(404).json({
          success: false,
          message: 'No orders found for the user.',
      });
  }

    res.render("orderSuccess", { order });
  } catch (err) {
    next(err);
  }
};


const loadOrder = async(req,res,next)=>{
  try{
    const userId = req.session.user_id;
    
    const orders = await Order.find({user:userId}).populate('user') .populate({
      path: 'products.product_Id',
      model: 'product', // Replace with your actual product model name
      select: 'productName', // Include the field(s) you want to populate
    }).sort({ orderDate: -1 });
      res.render("orders",{orders:orders})
  }
  catch(error)
  {
   next(error)
  }
}


const orderDetails = async (req, res, next) => {
  try{
  const userId = req.session.user_id;
  const orderId = req.query.id;

  let order; 

  if (orderId) {
      order = await Order.findOne({ _id: orderId })
          .populate({
              path: 'products.product_Id',
          })
          .sort({ orderDate: -1 });
  } else {
      order = await Order.findOne({ user: userId })
          .populate({
              path: 'products.product_Id',
          })
          .sort({ orderDate: -1 });
  }

  

  if (!order) {
      return res.status(404).json({
          success: false,
          message: 'No orders found for the user.',
      });
  }

    res.render("orderDetails", { order });
  } catch (err) {
    next(err);
  }
};


const cancelOrder = async (req, res) => {
  try {
    const userId = req.session.user_id;
    const orderId = req.params.orderId;
    const productId = req.params.productId;

    // Find the order by orderId and user ID
    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let canCancel = true;
    let refundedAmount = 0;

    for (const product of order.products) {
    
      if(product.product_Id._id.toString() === productId)
      {
        console.log(product.status)
      if (product.status === 'Delivered' || product.status === 'Canceled' || product.status==='Returned' || product.status == 'Return Placed') {
        canCancel = false;
        break; // Exit the loop if any product cannot be canceled
      } else {
          refundedAmount += product.total; // Accumulate the refunded amount
        }
    }
    }

    if (!canCancel) {
      return res.status(400).json({ success: false, message: 'Order cannot be canceled' });
    }
    let couponRefundAmount = 0;
  
    const ftotal = order.totalAmount

    if (order.coupon) {
      console.log("s1",refundedAmount)
      const couponData = await Coupon.findOne({ code: order.coupon.code });
      if (!couponData) {
        // Handle the case where no coupon data is found
        console.log("Coupon not found");
        order.totalAmount = ftotal - refundedAmount; // Update the totalAmount without coupon
      } else {
        order.totalAmount += order.coupon.discountTotal;

        if (Math.abs(order.totalAmount - refundedAmount) < couponData.minimumSpend) {
          // If refund amount is below minimum spend, remove coupon discount
          order.totalAmount = order.products.reduce((total, product) => {
            if (product.product_Id._id.toString() !== productId && product.status !== 'Canceled') {
              return total + product.total;
            }
            return total;
          }, 0);
          refundedAmount = ftotal - order.totalAmount; // Update refundedAmount
        } else {
          const couponRefundPercentage = couponData.discountPercentage;
          couponRefundAmount = (couponRefundPercentage / 100) * refundedAmount;
          refundedAmount -= couponRefundAmount;
          console.log("s2", refundedAmount);
          order.totalAmount -= refundedAmount + order.coupon.discountTotal;
        }
      }
    }


    if (refundedAmount < 0) {
      // const errorMessage = 'Refunded amount is less than zero. Please pay the remaining balance to cancel the product';
      // console.error(errorMessage);
      // return res.status(202).json({ success: false, message: errorMessage });
      order.totalAmount -= Math.abs(refundedAmount)
      refundedAmount = 0;
    }
    console.log('total:', order.totalAmount);

    // Set the status of the product with the specified productId to 'Canceled' within the order
    for (const product of order.products) {
      if (product.product_Id._id.toString() === productId) {
        
        product.status = 'Canceled';

      
          if(refundedAmount>0){
          product.paymentStatus = 'Refunded'
          }else{
            product.paymentStatus = 'Canceled'
          }
        
         // Save the product status
        await Product.findByIdAndUpdate(product.product_Id._id, {
          $inc: { quantity: product.quantity },
        });

        if(order.paymentOption=="Online"||order.paymentOption=="Wallet"){
          
        

          await User.findByIdAndUpdate({_id:userId},{$inc:{wallet:refundedAmount},$push: {
           walletHistory: {
             date: new Date(),
             amount: refundedAmount,
             description: `Refunded for Order cancel - Order ${order.orderID}`,
             transactionType:'Credit'
           },
         },})
        // } else{
          
        //   await User.findByIdAndUpdate({_id:userId},{$inc:{wallet:refundedAmount},$push: {
        //     walletHistory: {
        //       date: new Date(),
        //       amount: refundedAmount,
        //       description: `Refunded for Order cancel - Order ${order.orderID}`,
        //       transactionType:'Credit'
        //     },
        //   },})
        
            }
      }
    }

    await order.save();

    res.json({ success: true, message: 'Order has been canceled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel the order' });
  }
};

// const CouponCheak =async(req,res,next)=>{
//   try {
//    const couponCode=req.body.couponCode
//    const avgprice=[]
//   const total = req.body.total
//   const couponData = await Coupon.findOne({ code : couponCode })

  
//   if(couponData) {
//     const userExist = couponData.user.find((u) => u.toString() == req.session.userid)
//     if(userExist) {
//       res.json({failed:true})
//     }else{
//       req.session.code=couponCode
//       const discountTotal = Math.floor((couponData.discountPercentage/100)*total)
      
//         const cartDatacc=await Cart.findOneAndUpdate(
//           { userId: req.session.userid },
//           {
//             $inc: { grandTotal: -discountTotal },
//           $push: {
//             cuoponCode: {
//               code: couponCode,
//               incprice: discountTotal
//             }
//           },
          
//         }
//         );
//         const cartDataUpdate=await Cart.findOne({userId:req.session.userid})
//           for(let i=0;i<cartDataUpdate.items.length;i++){
//             avgprice.push(Math.floor(cartDataUpdate.items[i].total-(couponData.discountPercentage/100)*cartDataUpdate.items[i].total))
//           }
        
//       for (let i = 0; i < avgprice.length; i++) {
//          await Cart.findOneAndUpdate(
//           { userId: req.session.userid, "items._id": cartDatacc.items[i]._id },
//           { $set: { "items.$.total": avgprice[i] } },
//           { new: true }
//         );
//       }
     
      
//      res.json({success:true})
//       }
//    }else{
//     res.json({failed:true})
//    }
//   } catch (err) {
//   next(err)
//   }
// }

// const couponCheck = async (req, res, next) => {
//   try {
//     const userId = req.session.user_id;
//     const couponCode = req.body.couponCode;
//     const total = req.body.total;
//     const couponData = await Coupon.findOne({ code: couponCode });
//     const max = couponData.minimumSpend
//     const cartItems = await Cart.findOne({ user_id: userId }).populate({
//       path: 'items.product_Id',
//       model: 'product',
//     });

//     const totalAmount = cartItems.totalPrice

//     if (couponData) {
//       const userExist = couponData.user.find((u) => u.toString() === req.session.user_id);

//       if (userExist) {
//         res.json({ failed: true, message: 'Coupon already used by the user.' });
//       } else {
//         console.log("cart:",totalAmount)
//  if(total === totalAmount){
//         if(couponData.minimumSpend<=total){
//         // Store coupon code in session
//         req.session.code = couponCode;

//         // Calculate discount and new total
//         const discountTotal = Math.floor((couponData.discountPercentage / 100) * total);
//         const newTotal = total - discountTotal;

//         await Coupon.findOneAndUpdate({ code: couponCode }, { $push: { user: userId } });

//         // Store coupon information in session
//         req.session.coupon = {
//           code: couponCode,
//           discountTotal: discountTotal,
//         };

//         res.json({ success: true, newTotal: newTotal });
//       }
//       else{
//         res.json({failed:true,message:`Coupon is applicable for the purchase of ₹${max} or above`})
//       }
//       }else{
//         res.json({failed: true, message:'Cant Apply coupon to this amount'})
//       }
//     }} else {
//       res.json({ failed: true, message: 'Invalid coupon code.' });
//     }
//   } catch (err) {
//     next(err);
//   }
// };


const couponCheck = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const couponCode = req.body.couponCode;
    const total = req.body.total;
    const couponData = await Coupon.findOne({ code: couponCode });
    const max = couponData.minimumSpend;
    const cartItems = await Cart.findOne({ user_id: userId }).populate({
      path: 'items.product_Id',
      model: 'product',
    });

    const totalAmount = cartItems.totalPrice;

    if (couponData) {
      const userExist = couponData.user.find((u) => u.toString() === req.session.user_id);

      if (userExist) {
        res.json({ failed: true, message: 'Coupon already used by the user.' });
      } else {
        // Check if the coupon is valid based on dates
        const currentDate = new Date();
        if (currentDate < couponData.startDate || currentDate > couponData.expireDate) {
          res.json({ failed: true, message: 'Coupon is not currently valid.' });
          return;
        }

        if (total === totalAmount) {
          if (couponData.minimumSpend <= total) {
            // Store coupon code in session
            req.session.code = couponCode;

            // Calculate discount and new total
            const discountTotal = Math.floor((couponData.discountPercentage / 100) * total);
            const newTotal = total - discountTotal;

            

            // Store coupon information in session
            req.session.coupon = {
              code: couponCode,
              discountTotal: discountTotal,
              minimumSpend:couponData.minimumSpend,
              discountPercentage:couponData.discountPercentage
            };

            res.json({ success: true, newTotal: newTotal });
          } else {
            res.json({ failed: true, message: `Coupon is applicable for the purchase of ₹${max} or above` });
          }
        } else {
          res.json({ failed: true, message: 'Cannot apply coupon to this amount.' });
        }
      }
    } else {
      res.json({ failed: true, message: 'Invalid coupon code.' });
    }
  } catch (err) {
    next(err);
   
  }
};


const removeCoupon = async (req, res, next) => {
  try {
    const userId = req.session.user_id;

    // Assuming you have stored the applied coupon code in req.session.coupon.code
    const appliedCouponCode = req.session.coupon ? req.session.coupon.code : null;

    if (!appliedCouponCode) {
      return res.json({ failed: true, message: 'No coupon applied.' });
    }

    // Remove the applied coupon from the user's list
    await Coupon.findOneAndUpdate({ code: appliedCouponCode }, { $pull: { user: userId } });

    // Clear coupon-related data from the session
    req.session.coupon = null;

    // Get the updated cart total after removing the coupon
    const updatedCart = await Cart.findOne({ user_id: userId });
    const updatedTotal = updatedCart ? updatedCart.totalPrice : 0;

    res.json({ success: true, updatedTotal: updatedTotal });
  } catch (err) {
    next(err);
   
  }
};

// const persistCoupon =async(req, res) => {
//   try{
//   const coupon = req.body.coupon;

//   // Assuming you are using express-session middleware
//   req.session.coupon = coupon;

//   res.json({ success: true, message: 'Coupon information persisted successfully.' });

// }catch(error)
// {
//   res.status(500).render('505-error')
// }};

// // Example route to remove persisted coupon information from session
// const removePersistCoupon =async(req, res) => {
//   try{
//   // Assuming you are using express-session middleware
//   req.session.coupon = null;

//   res.json({ success: true, message: 'Persisted coupon information removed successfully.' });
// }catch(error)
// {
//   res.status(500).render('505-error')
// }};

// const couponCheck = async (req, res, next) => {
//   try {
//     const userId = req.session.user_id;
//     const couponCode = req.body.couponCode;
//     const total = req.body.total;
//     const couponData = await Coupon.findOne({ code: couponCode });
//     const max = couponData.minimumSpend;
//     const cartItems = await Cart.findOne({ user_id: userId }).populate({
//       path: 'items.product_Id',
//       model: 'product',
//     });

//     const totalAmount = cartItems.totalPrice;

//     if (couponData) {
//       const userExist = couponData.user.find((u) => u.toString() === req.session.user_id);

//       if (userExist) {
//         res.json({ failed: true, message: 'Coupon already used by the user.' });
//       } else {
//         if (total === totalAmount) {
//           if (couponData.minimumSpend <= total) {
//             // Iterate through each item in the cart and update the total
//             for (const item of cartItems.items) {
//               const discountTotal = Math.floor((couponData.discountPercentage / 100) * item.price);
//               item.total = item.quantity*(item.price - discountTotal);
//             }

//             // Recalculate the totalPrice based on the updated item totals
//             const newTotalPrice = cartItems.items.reduce((acc, item) => acc + item.total, 0);

//             // Update the cart with the new item totals and totalPrice
//             await Cart.findOneAndUpdate(
//               { user_id: userId },
//               { $set: { 'items.$[].total': 0 }, $inc: { totalPrice: newTotalPrice } }
//             );

//             // Store coupon code in session
//             req.session.code = couponCode;

//             // Store coupon information in session
//             req.session.coupon = {
//               code: couponCode,
//               discountTotal: newTotalPrice, // assuming you want to store the discount for the entire cart
//             };

//             res.json({ success: true, newTotal: newTotalPrice });
//           } else {
//             res.json({ failed: true, message: `Coupon is applicable for the purchase of ₹${max} or above` });
//           }
//         } else {
//           res.json({ failed: true, message: 'Cannot apply coupon to this amount.' });
//         }
//       }
//     } else {
//       res.json({ failed: true, message: 'Invalid coupon code.' });
//     }
//   } catch (err) {
//     next(err);
//   }
// };



// const returnJobSchedule = '0 0 * * *'; // Runs at midnight every day

// cron.schedule(returnJobSchedule, async () => {
//   try {
//     // Get orders that are eligible for return based on your criteria
//     console.log("hii")
//     const eligibleOrders = await getEligibleOrders();

//     // Process returns for each eligible order
//     for (const order of eligibleOrders) {
//       await processReturnOrder(order);
//     }

//     console.log('Return processing complete');
//   } catch (error) {
//     console.error('Error processing returns:', error);
//   }
// });


const orderReturn = async (req, res, next) => {
  try {
    const userId = req.session.user_id;
    const orderId = req.params.orderId;
    const productId = req.params.productId;

    // Get the current date
    const currentDate = new Date();

    // Check if the product was delivered within the last seven days
    const orderData = await Order.findOne({
      _id: orderId,
      'products.product_Id': productId,
      'products.status': 'Delivered', // Check if the product is delivered
    });

    // Validate if the orderData is found
    if (!orderData) {
      return res.status(404).json({
        success: false,
        message: 'Order or product not found',
      });
    }

    const productData = orderData.products.find(
      (product) => product.product_Id._id.toString() === productId
    );

    const deliveryDate = productData.deliveryDate;

    const daysDifference = Math.floor(
      (currentDate - new Date(deliveryDate)) / (1000 * 60 * 60 * 24)
    );

    if (daysDifference > 7) {
      return res.status(400).json({
        success: false,
        message: 'Product can only be returned within seven days of delivery',
      });
    }

    // Calculate the return date (current date + 4 days)
    const returnDate = new Date();
    returnDate.setDate(currentDate.getDate() + 4);

    // Apply coupon condition and calculate refund amount
   
    // Update product status to 'Return Placed'
    await Order.findOneAndUpdate(
      { _id: orderId, 'products.product_Id': productId },
      {
        $set: {
          'products.$.status': 'Return Placed',
          'products.$.returnDate': returnDate,
        },
      }
    );

    // Update the user's wallet with the calculated refund amount
   

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};



// const getEligibleOrders = async () => {
//   console.log('Fetching eligible orders for return...');

//   // Implement logic to retrieve orders eligible for return (e.g., within 7 days)
//   const currentDate = new Date();

//   const eligibleOrders = await Order.find({
//     'products.status': 'Delivered',
//     'products.returnDate': { $lte: currentDate },
//   });
//   console.log('Eligible orders for return:', eligibleOrders);
//   return eligibleOrders;
// };

// const processReturnOrder = async (order) => {
//   // Implement logic to process return for the order
//   console.log('Processing return for Order:', order.orderID);

//   for (const product of order.products) {
//     if (product.status === 'Returning within few days') {
//       // Update product status to 'Returned'
//       product.status = 'Returned';

//       // Update product stock in the inventory
//       await Product.findByIdAndUpdate({ _id: product.product_Id._id }, { $inc: { quantity: product.quantity } });

//       // Additional logic for processing returns (if needed)
//       // ...

//       console.log(`Return processed for Product ${product.product_Id._id} in Order ${order.orderID}`);
//     }
//   }

//   // Save the updated order with returned products
//   await order.save();
//   console.log('Return processing complete for Order:', order.orderID);
// };

module.exports ={
    placeOrder,
    loadOrderPlaced,
    loadOrder,
    orderDetails,
    cancelOrder,
    validatePaymentVerification,
    couponCheck,
    removeCoupon,
    orderReturn,
    // persistCoupon,
    // removePersistCoupon
}