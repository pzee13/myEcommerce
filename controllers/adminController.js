const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Coupon = require("../models/couponModel")
const bcrypt = require('bcrypt')
const path = require("path")
const Cart = require("../models/cartModel") 
const Order = require("../models/orderModel")
const fs = require("fs")

const securePassword = async(password)=>{ 
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    }
    catch (error)
    {
        
        next(error) 
    }
}

const loadadlogin = async(req,res,next)=>{

    try{
        res.render('adlogin')
    }
    catch(error){
        
        next(error)
    }
}

const verifyadlogin = async (req, res,next) => {
    try {
        
        const email = req.body.email;
        const password = req.body.password;
        
    
        const adminData = await Admin.findOne({ email:email })
        if(adminData){
          
    
          const passwordMatch = await bcrypt.compare(password,adminData.password);
    
          if(passwordMatch){   
            req.session.admin_id = adminData._id           
              res.redirect('/admin/home');
            }else{
                res.render('adlogin',{message:"Login details are incorrect" });
              }
    
          }else{
            res.render('adlogin',{message:"Login details are incorrect" });
          }
    
      }catch(error){
        
        next(error)
  }
}




  const loadusers = async(req,res,next)=>{
    try{
        res.render("users")
    }
    catch(error)
    {
        
        next(error)
    }
  }


  const loadviewUsers = async (req, res,next) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
      const pageSize = 10; // Set your desired page size
  
      const skip = (page - 1) * pageSize;
      const users = await User.find()
        .skip(skip)
        .limit(pageSize);
  
      const totalUsers = await User.countDocuments();
      const totalPages = Math.ceil(totalUsers / pageSize);
  
      res.render('users', { users, page,totalPages });
    } catch (error) {
      
      next(error)
    }
  };
  
  const searchUsers = async (req, res,next) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
      const pageSize = 10;
      const skip = (page - 1) * pageSize;

      const searchKeyword = req.query.key; // Get the search keyword from query parameters
  
      // Use a regular expression to perform a case-insensitive search
      const users = await User.find({
        $or: [
          { firstName: { $regex: new RegExp(searchKeyword, 'i') } },
          { lastName: { $regex: new RegExp(searchKeyword, 'i') } },
          { email: { $regex: new RegExp(searchKeyword, 'i') } },
        ],
      }).skip(skip)
      .limit(pageSize);

      const totalUsers = await User.countDocuments();
      const totalPages = Math.ceil(totalUsers / pageSize);
  
  
      res.render('users', { users, page,totalPages });
    } catch (error) {
      
      next(error)
    }
  };


  const blockUser = async (req, res,next) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
      const pageSize = 10; // Set your desired page size
  
      const id = req.query.id;
      const skip = (page - 1) * pageSize;
      const user1 = await User.findById(id)

      if (user1) {
        user1.isBlock = !user1.isBlock 
        await user1.save(); 
        
      

      if(req.session.user_id===id){
        req.session.destroy();
      }
    }
  
      const users2 = await User.find().skip(skip).limit(pageSize);
      const totalUsers = await User.countDocuments();
      const totalPages = Math.ceil(totalUsers / pageSize);
 
      res.redirect('/admin/view_users')

    } catch (error) {   
      
      next(error)   
    }
  };


  const loadorders = async(req,res,next)=>{
    try{
      
      const orders = await Order.find().populate('user').populate({
        path: 'products.product_Id',
    }).sort({orderDate:-1})

      const products = await Cart.find().populate('items.product_Id')
      res.render("addorder",{orders:orders,products})
    }
    catch(error)
    {
      
      next(error)
    }
  }


  const adorderDetails = async (req, res,next) => {
    try{
    
    const orderId = req.query.id;
  
     // Declare order variable outside the if-else block
  let orders
    if (orderId) {
       orders = await Order.findOne({ _id: orderId })
            .populate({
                path: 'products.product_Id',
            })
            .sort({ orderDate: -1 });
    } 
    
  
    if (!orders) {
        return res.status(404).json({
            success: false,
            message: 'No orders found for the user.',
        });
    }
  
      res.render("adorderDetails", { order:orders });
    } catch (err) {
      
      next(err)
    }
  };
  



  const updateOrderStatus = async (req, res,next) => {
    try {

        const { productId, orderId, value } = req.body;
     

        // Find the order by ID
        const order = await Order.findById(orderId);


        const statusMap = {
          'Shipped': 2,
          'Out for Delivery': 3,
          'Delivered': 4,
        };
    
        const selectedStatus = value;
        const statusLevel = statusMap[selectedStatus];
    
      


        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Find the product within the order's products array
        const product = order.products.find((prod) => prod.product_Id.toString() === productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found in the order' });
        }

        // Check if the product is already canceled
        if (product.status === 'Canceled') {
            return res.status(400).json({ success: false, message: 'Product is already canceled' });
        }

        if(product.status === 'Delivered'){
          return res.status(400).json({ success: false, message: 'Product is already delivered' });
        }

        if(product.status === 'Return placed'){
          return res.status(400).json({ success: false, message: 'Product is already delivered' });
        }

        if(product.status === 'Returned'){
          return res.status(400).json({ success: false, message: 'Product Returned back' });
        }

        // Update the status of the product in the order
        product.status = value; // Assuming 'status' is a field in your database
        product.StatusLevel = statusLevel;

        if (product.status === 'Delivered') {
        if (order.paymentOption === 'COD') {
          product.paymentStatus = 'Success';
        }
      }

        await order.save();

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
};




// const cancelOrder = async (req, res,next) => {
//   try {
  
//     const orderId = req.params.orderId;
//     const productId = req.params.productId;

//     // Find the order by orderId and user ID
//     const order = await Order.findOne({ _id: orderId});

//     if (!order) {
//       return res.status(404).json({ success: false, message: 'Order not found' });
//     }

//     let canCancel = true;

//     for (const product of order.products) {
    
//       if(product.product_Id._id.toString() === productId)
//       {
//         console.log(product.status)
//       if (product.status === 'Delivered' || product.status === 'Canceled') {
//         canCancel = false;
//         break; // Exit the loop if any product cannot be canceled
//       }
//     }
//     }

//     if (!canCancel) {
//       return res.status(400).json({ success: false, message: 'Order cannot be canceled' });
//     }

//     // Set the status of the product with the specified productId to 'Canceled' within the order
//     for (const product of order.products) {
//       if (product.product_Id._id.toString() === productId) {
//         product.status = 'Canceled';
//          // Save the product status
//         await Product.findByIdAndUpdate(product.product_Id._id, {
//           $inc: { quantity: product.quantity },
//         });
//       }
//     }

//     await order.save();

//     res.json({ success: true, message: 'Order has been canceled' });
//   } catch (error) {
//     
//     res.status(500).json({ success: false, message: 'Failed to cancel the order' });
//   }
// };


const cancelOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.params.productId;

    // Find the order by orderId
    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let canCancel = true;
    let refundedAmount = 0;

    for (const product of order.products) {
      if (product.product_Id._id.toString() === productId) {
   
        if (product.status === 'Delivered' || product.status === 'Canceled') {
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
  
      const couponData = await Coupon.findOne({ code: order.coupon.code });
      order.totalAmount += order.coupon.discountTotal

      if (couponData && Math.abs(order.totalAmount - refundedAmount) < couponData.minimumSpend) {
        // If refund amount is below minimum spend, remove coupon discount
        order.totalAmount = order.products.reduce((total, product) => {
          if (product.product_Id._id.toString() !== productId && product.status !== 'Canceled') {
            return total + product.total;
          }
          return total;
        }, 0);

        refundedAmount = ftotal - order.totalAmount; // Update refundedAmount
        // Calculate coupon refund amount
      } else {
        const couponRefundPercentage = couponData.discountPercentage || 0;
        couponRefundAmount = (couponRefundPercentage / 100) * refundedAmount;
        refundedAmount -= couponRefundAmount;
       
        order.totalAmount -= (refundedAmount + order.coupon.discountTotal);
      }
    }

    if (refundedAmount < 0) {
      order.totalAmount -= Math.abs(refundedAmount);
      refundedAmount = 0;
    }


    // Set the status of the product with the specified productId to 'Canceled' within the order
    for (const product of order.products) {
      if (product.product_Id._id.toString() === productId) {
        product.status = 'Canceled';

        if (refundedAmount > 0) {
          product.paymentStatus = 'Refunded';
        } else {
          product.paymentStatus = 'Canceled';
        }

        // Save the product status
        await Product.findByIdAndUpdate(product.product_Id._id, {
          $inc: { quantity: product.quantity },
        });

        if (order.paymentOption == "Online" || order.paymentOption == "Wallet") {
          // Refund the amount to the user's wallet
          const userId = order.user;
          await User.findByIdAndUpdate({ _id: userId }, {
            $inc: { wallet: refundedAmount },
            $push: {
              walletHistory: {
                date: new Date(),
                amount: refundedAmount,
                description: `Refunded for Order cancel - Order ${order.orderID}`,
                transactionType: 'Credit'
              },
            },
          });
        }
      }
    }

    await order.save();

    res.json({ success: true, message: 'Order has been canceled' });
  } catch (error) {
    next(error);
    res.status(500).json({ success: false, message: 'Failed to cancel the order' });
  }
};

const returnOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const productId = req.params.productId;

    // Find the order by orderId
    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let canReturn = true;
    let refundedAmount = 0;

    for (const product of order.products) {
      if (product.product_Id._id.toString() === productId) {
        if (product.status !== 'Return Placed') {
          canReturn = false;
          break; // Exit the loop if any product cannot be returned
        } else {
          refundedAmount += product.total; // Accumulate the refunded amount
        }
      }
    }

    if (!canReturn) {
      return res.status(400).json({ success: false, message: 'Order cannot be returned' });
    }

    let couponRefundAmount = 0;

    const ftotal = order.totalAmount

    if (order.coupon) {

      const couponData = await Coupon.findOne({ code: order.coupon.code });
      if (!couponData) {
        // Handle the case where no coupon data is found
      
        order.totalAmount = ftotal - refundedAmount; // Update the totalAmount without coupon
      } else {
        order.totalAmount += order.coupon.discountTotal;

        if (Math.abs(order.totalAmount - refundedAmount) < couponData.minimumSpend) {
          // If refund amount is below minimum spend, remove coupon discount
          const nonReturnedProductsTotal = order.products.reduce((total, product) => {
            if (product.product_Id._id.toString() !== productId && product.status !== 'Returned') {
              return total + product.total;
            }
            return total;
          }, 0);
          order.totalAmount = nonReturnedProductsTotal; // Update order totalAmount
          refundedAmount = ftotal - order.totalAmount; // Update refundedAmount
        } else {
          const couponRefundPercentage = couponData.discountPercentage;
          couponRefundAmount = (couponRefundPercentage / 100) * refundedAmount;
          refundedAmount -= couponRefundAmount;
   
          order.totalAmount -= refundedAmount + order.coupon.discountTotal;
        }
      }
    }

    if (refundedAmount < 0) {
      order.totalAmount -= Math.abs(refundedAmount);
    }


    // Refund the amount to the user's wallet
    const userId = order.user;
    await User.findByIdAndUpdate({ _id: userId }, {
      $inc: { wallet: refundedAmount },
      $push: {
        walletHistory: {
          date: new Date(),
          amount: refundedAmount,
          description: `Refunded for Order Return - Order ${order.orderID}`,
          transactionType: 'Credit',
        },
      },
    });

    // Set the status of the product to 'Returned' within the order
    for (const product of order.products) {
      if (product.product_Id._id.toString() === productId) {
        product.status = 'Returned';
        product.paymentStatus = 'Refunded';
        // Save the product status
        await Product.findByIdAndUpdate(product.product_Id._id, {
          $inc: { quantity: product.quantity },
        });
      }
    }

    // Adjust the order total amount
    await order.save();

    res.json({ success: true, message: 'Order has been returned' });
  } catch (error) {
    next(error);
    res.status(500).json({ success: false, message: 'Failed to return the order' });
  }
};


const adLogout = async(req,res,next)=>{

  try{
      req.session.destroy()
      res.redirect('/admin')
  }
  catch (error)
      {
          
          next(error)
      }
}

const load404 = async(req,res,next)=>{

  try{
      
      res.render('404error')
  }
  catch (error)
      {
          
          next(error)
     }
}











module.exports = {
    loadadlogin,
    verifyadlogin,
    loadusers,
    loadviewUsers,
    blockUser,
    adLogout,
    searchUsers,
    loadorders,
    load404,
    updateOrderStatus,
    adorderDetails,
    cancelOrder,
    returnOrder

}   