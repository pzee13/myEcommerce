const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
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
        console.log(error.message)
    }
}

const loadadlogin = async(req,res)=>{

    try{
        res.render('adlogin')
    }
    catch(error){
        console.log(error.message)
    }
}

const verifyadlogin = async (req, res) => {
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
        console.log(error.message);
  }
}


const loadadHome = async(req,res)=>{
    try{
        res.render('dashboard')
    }
    catch(error)
    {
        console.log(error.message)
    }
}


  const loadusers = async(req,res)=>{
    try{
        res.render("users")
    }
    catch(error)
    {
        console.log(error.message)
    }
  }



  // const loadviewUsers =  async (req, res) => {

  //   const page = parseInt(req.query.page) || 1; // Default to page 1
  //   const itemsPerPage = parseInt(req.query.itemsPerPage) || 10; // Default to 10 items per page


  //   try {
    
  //   const usersCount = await User.countDocuments();
  //   const totalPages = Math.ceil(usersCount / itemsPerPage);
  //   const skip = (page - 1) * itemsPerPage;

  //     const user = await User.find().skip(skip).limit(itemsPerPage);

  //     res.render('users', { users: user, page, itemsPerPage, totalPages });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send('Internal Server Error'); 
  //  }
  // };

  // const loadviewUsers = async (req, res) => {
  //   try {
  //     const page = req.query.page || 1; // Get the current page from query parameters or default to 1
  //     const itemsPerPage = 10; // Set your desired page size
  
  //     const skip = (page - 1) * itemsPerPage;
  //     const users = await User.find()
  //       .skip(skip)
  //       .limit(itemsPerPage);
  
  //     const totalUsers = await User.countDocuments();
  //     const totalPages = Math.ceil(totalUsers / itemsPerPage);
  
  //     res.render('users', { users, currentPage: parseInt(page), totalPages });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send('Internal Server Error');
  //   }
  // };
  
  const loadviewUsers = async (req, res) => {
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
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  const searchUsers = async (req, res) => {
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
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };


  const blockUser = async (req, res) => {
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
        req.session.user_id=null;
      }
    }
  
      const users2 = await User.find().skip(skip).limit(pageSize);
      const totalUsers = await User.countDocuments();
      const totalPages = Math.ceil(totalUsers / pageSize);
 
      res.redirect('/admin/view_users')

    } catch (error) {   
      console.log(error);   
    }
  };


  const loadorders = async(req,res)=>{
    try{
      
      const orders = await Order.find().populate('user').populate({
        path: 'products.product_Id',
    }).sort({orderDate:-1})

      const products = await Cart.find().populate('items.product_Id')
      res.render("addorder",{orders:orders,products})
    }
    catch(error)
    {
      console.log(error.message)
    }
  }


  const adorderDetails = async (req, res, next) => {
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
      next(err);
    }
  };
  


  // const loadorders = async (req, res) => {
  //   try {
  //     const orders = await Order.find().populate('user');
  
  //     const productWiseOrdersArray = [];
  
  //     for (const order of orders) {
  //       for (const productInfo of order.products) {
  //         const productId = productInfo.product_Id; // Assuming product_Id is the correct field
  
  //         const product = await Product.findById(productId).select('productName images price');
  //         const userDetails = order.user; // 'user' field is already populated
  
  //         if (product) {
  //           // Push the order details with product details into the array
  //           productWiseOrdersArray.push({
  //             user: userDetails,
  //             product: product,
  //             orderDetails: {
  //               _id: order._id,
  //               userId: order.user._id, // Assuming user._id is the correct field
  //               shippingAddress: order.deliveryAddress, // Assuming deliveryAddress is the correct field
  //               orderDate: order.orderDate,
  //               totalAmount: productInfo.total, // Assuming 'total' is the correct field
  //               OrderStatus: productInfo.status,
  //               paymentStatus: order.paymentOption, // Assuming paymentOption is the correct field
  //               paymentMethod: '', // You may add the actual payment method here
  //               quantity: productInfo.quantity,
  //             },
  //           });
  //         }
  //       }
  //     }
  
  //     res.render('addorder', { orders: productWiseOrdersArray });
  //   } catch (error) {
  //     console.log(error.message);
  //   }
  // };

  const updateOrderStatus = async (req, res) => {
    try {
        const { productId, orderId, value } = req.body;
        console.log(value);
        console.log(orderId);
        console.log(productId);

        // Find the order by ID
        const order = await Order.findById(orderId);

        const statusMap = {
          'Shipped': 2,
          'Out for Delivery': 3,
          'Delivered': 4,
        };
    
        const selectedStatus = value;
        const statusLevel = statusMap[selectedStatus];
    
        console.log(statusLevel);

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

        // Update the status of the product in the order
        product.status = value; // Assuming 'status' is a field in your database
        product.StatusLevel = statusLevel;
        await order.save();

        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update order status' });
    }
};




const cancelOrder = async (req, res) => {
  try {
  
    const orderId = req.params.orderId;
    const productId = req.params.productId;

    // Find the order by orderId and user ID
    const order = await Order.findOne({ _id: orderId});

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let canCancel = true;

    for (const product of order.products) {
    
      if(product.product_Id._id.toString() === productId)
      {
        console.log(product.status)
      if (product.status === 'Delivered' || product.status === 'Canceled') {
        canCancel = false;
        break; // Exit the loop if any product cannot be canceled
      }
    }
    }

    if (!canCancel) {
      return res.status(400).json({ success: false, message: 'Order cannot be canceled' });
    }

    // Set the status of the product with the specified productId to 'Canceled' within the order
    for (const product of order.products) {
      if (product.product_Id._id.toString() === productId) {
        product.status = 'Canceled';
         // Save the product status
        await Product.findByIdAndUpdate(product.product_Id._id, {
          $inc: { quantity: product.quantity },
        });
      }
    }

    await order.save();

    res.json({ success: true, message: 'Order has been canceled' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel the order' });
  }
};



const adLogout = async(req,res)=>{

  try{
      req.session.destroy()
      res.redirect('/admin')
  }
  catch (error)
      {
          console.log(error.message)
      }
}

const  load404 = async(req,res)=>{

  try{
      
      res.render('404error')
  }
  catch (error)
      {
          console.log(error.message)
     }
}


module.exports = {
    loadadlogin,
    verifyadlogin,
    loadadHome,
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

}   