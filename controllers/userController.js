
const Swal = require('sweetalert2');
const mongoose = require("mongoose");
const User = require('../models/userModels/userModel') 
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Banner = require("../models/bannerModel")
const Coupon = require("../models/couponModel")
const nodemailer = require("nodemailer")
const bcrypt = require('bcrypt')
const randomstring = require('randomstring')
const path = require("path")
const otpGenerator = require("otp-generator")
const Cart = require('../models/cartModel')
const PDFDocument = require('pdfkit')
const shortid = require('shortid');
const dotenv = require("dotenv").config()

const Order = require("../models/orderModel")
const Razorpay = require("razorpay")
var crypto = require("crypto");

var instance = new Razorpay({
    key_id: process.env.Razorpay_KEY_ID,
    key_secret: process.env.Razorpay_KEY_SECRET
  });
  

const securePassword = async(password,next)=>{
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    }
    catch (error)
    {
       next(error)
    }
}


const sendVerificationEmail = async (email, otp,next) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.SMTP_MAIL,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.SMTP_MAIL,
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
      next(error)
    }
}

const resetPasswordMail = async(firstName,lastName,email, token,next)=>{
    try 
        {
            const transporter = nodemailer.createTransport({
                host:'smtp.gmail.com',
                port:587,
                secure:false,
                requireTLS:true,
                auth:{
                    user:process.env.SMTP_MAIL,
                    pass:process.env.SMTP_PASS,
                },
            })
            const mailOptions = {
                from:'aswinpc9@gmail.com',
                to:email,
                subject:'For Reset Password',
                html: `<p> Hi, ${firstName} ${lastName}, please click here to <a href="https:/www.formenn.shop/forget-password?token=${token}"> Reset </a> your password</p>`
            }
            transporter.sendMail(mailOptions,function(error,info,next){
                if(error)
                    {
                       next(error)
                    }
                else
                    {
                        console.log("Email has been sent:-",info.response)
                    }
            })
        }
    catch (error)
        {
            next(error)
        }
}


const loginLoad = async(req,res,next)=>{

    try{
        
        res.render('login')
    }
    catch(error){
        
        next(error)
    }
}

// const loadHome = async (req, res) => {
//     try {
//       res.redirect('/');
//     } catch (error) {
//       ;
//     }
//   }

const loadRegister = async(req,res,next)=>{
    try {
        res.render('registration')
    }
    catch (error)
    {
        
        next(error)
    }
}


const showverifyOTPPage = async (req, res) => {
    try {
      res.render('user-otp');
    } catch (error) {
      ;
      next(error)
    }
  }
  
 
const insertUser = async (req, res,next) => {
    try {
        
        // Generate OTP
        const otpCode = otpGenerator.generate(6, { 
            digits: true,
            alphabets: false, 
            specialChars: false, 
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false 
        });
        const otpcurTime = Date.now()/1000
        const otpExpiry = otpcurTime + 45

        const userCheck = await User.findOne({email:req.body.email})
        if(userCheck)
        {
            res.render('registration',{message:"User already exist"});
        }
        else{
            const spassword = await securePassword(req.body.password);
            req.session.fname = req.body.fname;
            req.session.lname = req.body.lname;
            req.session.mobileno = req.body.mobileno;
            req.session.email = req.body.email;

            if (req.body.referralCode) {
                // Check if the referral code provided by the user exists
                const referringUser = await User.findOne({ referralCode: req.body.referralCode });
          
                if (referringUser) {
                  req.session.referralUserId = referringUser._id; // Save referring user ID in session
                } else {
                  res.render('registration', { message: 'Invalid referral code. Please use a valid referral code.' });
                  return;
                }
              }

              // Generate a unique referral code using shortid
              const referralCode = shortid.generate();
              req.session.referralCode = referralCode; //
          

            if(req.body.fname && req.body.email && req.session.lname && req.session.mobileno){
                if(req.body.password === req.body.cpassword) {
                    req.session.password = spassword;
                    req.session.otp = {
                        code: otpCode,
                        expiry: otpExpiry,
                    };        
                        // Send OTP to the user's email
                        sendVerificationEmail(req.session.email, req.session.otp.code);
                        res.render("user-otp")
                    } else {
                        res.render("registration",{message: "Password doesn't match"})
                    }
                }
                else{
                    res.render("registration",{message: "Please enter all details"})
                }
                }
         


    } catch (error) {
        
        next(error)
    }
}


const verifyOTP = async (req, res)=>{
    try {
        const currentTime = Math.floor(Date.now() / 1000)
        if(req.body.otp === req.session.otp.code&&currentTime<=req.session.otp.expiry){
            const user = new User({
                firstName: req.session.fname,
                lastName: req.session.lname,
                email: req.session.email,
                mobile: req.session.mobileno,
                referralCode: req.session.referralCode,
                password: req.session.password,
                isVerified:1
            });

            const result = await user.save()

            if(req.session.referralUserId){
                const referringUser = await User.findById(req.session.referralUserId);

                const bonusAmount = 100;

                referringUser.wallet += bonusAmount;
                referringUser.walletHistory.push({
                  date: new Date(),
                  amount: bonusAmount,
                  description: `Referral bonus by referring user ${result.firstName}`,
                  transactionType: 'Credit',
                });
                await referringUser.save();
      
                result.wallet += bonusAmount;
                result.walletHistory.push({
                   date: new Date(),
                  amount: bonusAmount,
                  description: "Referral bonus",
                  transactionType: 'Credit',
                });
                await result.save();
            }

            res.redirect("/login")
        }
        else{
            res.render('user-otp',{message:"invalid OTP"});
        }
    } catch (error) {
        ;
        next(error)
    }
}


const resendOTP = async (req,res,next)=>{
    try{
        const currentTime = Date.now()/1000;
      
        if (req.session.otp.expiry != null) {
        if(currentTime > req.session.otp.expiry){

            const newDigit = otpGenerator.generate(6, { 
                digits: true,
                alphabets: false, 
                specialChars: false, 
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false 
            });
                req.session.otp.code = newDigit;
                const newExpiry = currentTime + 45;
                req.session.otp.expiry = newExpiry;
                sendVerificationEmail(req.session.email, req.session.otp.code);
                res.render("user-otp",{message:"OTP has been send"});
            }else{
                res.render("user-otp",{message: "You can request a new otp after old otp expires"});
            }
        }
        else{
            res.send("Please register again")
        }
    }
    catch (error)
    {
        
        next(error)
    }
}


const verifyLogin = async (req, res,next) => {
    try {
        const Email = req.body.email
        const Password = req.body.password

        const userData = await User.findOne({ email:Email})
        if (userData) {

            if (userData.isBlock == false) {


                const passwordMatch = await bcrypt.compare(Password, userData.password)

                if (passwordMatch) {
                    if (userData.is_verified == false) {

                        res.render('login', { message: "please verify your mail" })
                    }
                    else {


                        req.session.user_id = userData._id

                        res.redirect('/')
                    }
                }
                else {
                    res.render('login', { message: "Email and  password is incorrect" })
                }

            } else {

                res.render('login', { message: "This User is blocked" })
            }
        }
        else {
            res.render('login', { message: "Email and  password is incorrect" })

        }
    }
    catch (err) {

        next(err)
        next(err)
    }
}

const loaduserHome = async (req, res,next) => {
    try {
        const userId = req.session.user_id 
        
    
      const banners = await Banner.find()
      const products = await Product.find({ status: 1 }).populate('category').populate('offer')
      const categories = await Category.find()
      res.render('userHome',{product:products,banners:banners,category:categories});
        
    } catch (error) {
      ;
      next(error)
    }
  }


// const userPoductload = async (req, res) => {
//     try {
//       res.render('userProduct');
//     } catch (error) {
//       ;
//     }
//   }

  const forgotLoad = async(req,res,next)=>{
    try{
        res.render('forgot')
    }
    catch(error)
    {
        ;
        next(error)
    }
  }
  
  const forgotVerify = async(req,res,next)=>{
    try{
        const email = req.body.email
        const userData = await User.findOne({email:email})

        if(userData){
            if(userData.isVerified === 0){
                res.render('forgot',{message:"Please verify your mail"})
            }
            else{
                const randomString = randomstring.generate()
                const updatedData = await User.updateOne({email:email},{$set:{ token:randomString }})
                resetPasswordMail(userData.firstName,userData.lastName,userData.email,randomString)
                res.render('forgot',{message:"Please check your mail to reset your password"})
            }
        }
        else{
            res.render('forgot',{message:"User email is incorrect"})
        }
    }
    catch(error)
    {
        ;
        next(error)
    }
  }


  const forgetPasswordLoad = async(req,res,next)=>{

    try{
        const token = req.query.token
        const tokenData = await User.findOne({token:token})
        if(tokenData){
            res.render('forget-password',{user_id:tokenData._id})
        }
        else{
            res.render('404',{message:"Token is invalid"})
        }
    }
    catch(error)
    {
        
        next(error)
    }
  }

  const resetPassword = async(req,res,next)=>{
    try{
        const password = req.body.password
        const user_id = req.body.user_id

        const spassword = await securePassword(password)

        const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{ password:spassword, token:''}})

        res.redirect('/login')

    }
    catch(error){
        ;
        next(error)
    }
    
  }


  const userLogout = async(req,res,next)=>{

    try
    {
        req.session.destroy()
        res.redirect('/')
    }
    catch (error)
    {
        
        next(error)
        return
    }
}

// const viewProducts = async (req, res) => {
//     try {
//         const page = req.query.page || 1; // Get the current page from query parameters
//         const pageSize = 12; // Set your desired page size
//         const userId = req.session.user_id;
        
//         // Assuming Cart is a Mongoose model and the user_id is stored as a string
//         const products1 = await Cart.findOne({ user_id: userId }).populate('items.product_Id');

//         const skip = (page - 1) * pageSize;
//         const products = await Product.find({ status: 1 }).populate('category').populate('offer').skip(skip)
//             .limit(pageSize);

//         const totalProducts = await Product.countDocuments({ status: 1 }); // Count only products with status 1
//         const totalPages = Math.ceil(totalProducts / pageSize);

//         const categories = await Category.find();

//         res.render('userProduct', {
//             product: products,
//             category: categories,
//             currentPage: page,
//             totalPages: totalPages,
//             products: products1,
//             userIsLoggedIn: req.session.user_id ? true : false
//         });
//     } catch (error) {
       
//         next(error)
//     }
// };


const viewProducts = async (req, res, next) => {
    try {
      const page = req.query.page || 1;
      const pageSize = 8;
      const userId = req.session.user_id;
  
      // Assuming Cart is a Mongoose model and the user_id is stored as a string
      const productsInCart = await Cart.findOne({ user_id: userId }).populate('items.product_Id');
  
      let search = '';
      let minPrice = 1;
      let maxPrice = 20000;
  
      let categoryFilter = null;
     
  
      if (req.query.search) {
        search = req.query.search;
      }
  
      if (req.query.minPrice) {
        minPrice = req.query.minPrice;
      }
  
      if (req.query.maxPrice) {
        maxPrice = req.query.maxPrice;
      }

  
      if (req.query.category) {
        categoryFilter = req.query.category;
      }
  
      const query = {
        status: 1,
        $or: [
          { name: { $regex: '.*' + search + '.*', $options: 'i' } },
          { brand: { $regex: '.*' + search + '.*', $options: 'i' } },
          { productName: { $regex: '.*' + search + '.*', $options: 'i' } },
        ],
        price: { $gte: minPrice, $lte: maxPrice },
      };
  
      if (categoryFilter) {
        query.category = categoryFilter;
      }
  
   
      const skip = (page - 1) * pageSize;
      let products = await Product.find(query)
        .populate('category')
        .populate('offer')
        .skip(skip)
        .limit(pageSize)
        

        let sortValue = -1;
            if (req.query.sortValue) {
                if (req.query.sortValue === '2') {
                    sortValue = 1;
                } else if (req.query.sortValue === '1') {
                    sortValue = -1;
                } else {
                    sortValue = -1;
                }
            }
  
      const totalProducts = await Product.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / pageSize);
  
      const categories = await Category.find();

      if (req.query.sortValue && req.query.sortValue != 3) {
        products = await Product.find(query)
            .populate('category')
            .populate('offer')
            .sort({ price: sortValue })
            .limit(pageSize)
            .skip((page - 1) * pageSize);
    } else {
        products = await Product.find(query)
            .populate('category')
            .populate('offer')
            .sort({ createdAt: sortValue })
            .limit(pageSize)
            .skip((page - 1) * pageSize);
    }

     
  
      res.render('userProduct', {
        product: products,
        category: categories,
        currentPage: page,
        totalPages: totalPages,
        products: productsInCart,
        userIsLoggedIn: req.session.user_id ? true : false,
        search: search,
        minPrice: minPrice,
        maxPrice: maxPrice,
        sortValue: req.query.sortValue,
        categoryFilter: categoryFilter,
       
      });
    } catch (error) {
      next(error);
    }
  };
  




// const filterPrice = async (req, res) => {
//     const minPrice = parseFloat(req.query.minPrice);
//     const maxPrice = parseFloat(req.query.maxPrice);
  
//     // Check if minPrice and maxPrice are valid numbers
//     if (isNaN(minPrice) || isNaN(maxPrice)) {
//         return res.status(400).json({ error: "Invalid minPrice or maxPrice values." });
//     }



//     try {
//         // Fetch products based on the min and max price and status 1 from your database
//         const filteredProducts = await Product.find({
//             status: 1, // Add the condition to filter only products with status 1
//             'price': { $gt: minPrice, $lte: maxPrice },
//         }).populate("category offer")

    
//         res.json({ products: filteredProducts });
//     } catch (error) {
     
//         res.status(500).json({ error: "An error occurred while fetching filtered products by price." });
//     }
// };

// const filterCategory = async (req, res) => {
//     const categoryId = req.query.categoryId;

//     try {
//         // Fetch products based on the category and status 1 from your database
//         const filteredProducts = await Product.find({
//             status: 1, // Add the condition to filter only products with status 1
//             category: categoryId,
//         }).populate("category offer");

//         res.json({ products: filteredProducts });
//     } catch (error) {
    
//         res.status(500).json({ error: "An error occurred while fetching filtered products by category." });
//     }
// };



  const getProductDetails = async (req, res,next) => {
    try {
        const id = req.query.id; // You should adjust this based on your route structure
        const product = await Product.findById({_id:id}).populate('category').populate('offer');
        const userId = req.session.user_id 
      
        if (!product) {
            return res.status(404).render('404-error', { message: 'Product not found' });
        }
        
        const reviews = product.reviews

        const userReviews = reviews.filter(review => review.user.userId === userId)

        res.render('productDetails', { product:product,userId:userId,reviews:reviews,userReviews:userReviews});
    } catch (error) {
       
        next(error)
        
    }
};

// const getProductDetails = async (req, res) => {
//     try {
//         // Access the productId from query parameters
//         const productId = req.query.id;

//         if (!productId) {
//             return res.status(400).render('error', { message: 'Product ID is missing' });
//         }

//         const product = await Product.findById(productId).populate('category');

//         if (!product) {
//             return res.status(404).render('error', { message: 'Product not found' });
//         }

//         res.render('productDetails', { product: product });
//     } catch (error) {
//        
//         res.status(500).render('error', { message: 'Internal Server Error' });
//     }
// };
// const searchProducts = async (req, res) => {
//     try {
//         const keyword = req.query.keyword;
//         const page = req.query.page || 1;
//         const pageSize = 10;

//         // Check if the keyword is present for search or if it's a clear request
//         if (keyword && keyword.trim() !== '') {
//             // Perform a case-insensitive search on product names and descriptions
//             const products = await Product.find({
//                 $and: [
//                     { status: 1 }, // Add the condition to search only products with status 1
//                     {
//                         $or: [
//                             { productName: { $regex: keyword, $options: 'i' } },
//                             { description: { $regex: keyword, $options: 'i' } },
//                         ],
//                     },
//                 ],
//             })
//                 .skip((page - 1) * pageSize)
//                 .limit(pageSize)
//                 .populate('category');

//             const totalProducts = await Product.countDocuments({
//                 $and: [
//                     { status: 1 }, // Add the condition to count only products with status 1
//                     {
//                         $or: [
//                             { productName: { $regex: keyword, $options: 'i' } },
//                             { description: { $regex: keyword, $options: 'i' } },
//                         ],
//                     },
//                 ],
//             });

//             const totalPages = Math.ceil(totalProducts / pageSize);

//             // Fetch categories for the sidebar
//             const categories = await Category.find();

//             const userId = req.session.user_id;
//             const products1 = await Cart.findOne({ user_id: userId }).populate('items.product_Id');

//             res.render('userProduct', {
//                 product: products,
//                 category: categories,
//                 currentPage: page,
//                 totalPages: totalPages,
//                 products: products1,
//                 userIsLoggedIn: req.session.user_id ? true : false,
//                 keyword: keyword, // Pass the keyword to the view for display or further processing
//             });
//         } else {
//             // If there's no keyword or it's empty, redirect to the product listing route without search parameters
//             res.redirect('/product');
//         }

//     } catch (error) {
       
//         next(error)
//     }
// };


  const walletHistory = async (req, res,next) => {
    try {
      const  userId  = req.session.user_id
      const walletData = await User.aggregate([
        { $match: { _id:new mongoose.Types.ObjectId(userId)} },
        {$project:{walletHistory:1}},
        { $unwind: "$walletHistory" },
        { $sort: { "walletHistory.date": -1 } }
      ]);
   
    
      res.render("walletHistory", { walletData});
    } catch (err) {

     next(err)
    
    }
  };


  const addMoneyWallet = async (req,res,next)=>{
    try {
      

    const {amount}=req.body
   
    const id=crypto.randomBytes(8).toString('hex')

    var options={ 
        amount:amount*100,
        currency:'INR',
        receipt:""+id
    }
  
    
    instance.orders.create(options, (err, order) => {
       
        if(err){
         
            res.json({status: false})
        }else{
        
            res.json({ status: true, order:order })
        }
    
    })
    
    } catch (error) {
        
        next(error)
    }
}


const verifyWalletpayment = async(req,res,next)=>{
    try{
  

  
     
      const userId=req.session.user_id
  
      const body = req.body;
   
      const amount = parseInt(body.order.amount)/100;
          let hmac = crypto.createHmac('sha256',process.env.Razorpay_KEY_SECRET)
  
  
          hmac.update(
            body.payment.razorpay_order_id + '|' + body.payment.razorpay_payment_id
        )
        hmac = hmac.digest('hex')
        if(hmac == body.payment.razorpay_signature){
            
          const walletHistory = {
            date: new Date(),
            description: 'Deposited via Razorpay',
            transactionType: 'Credit',
            amount: amount,
        }
            await User.findByIdAndUpdate(
                {_id: userId},
                {
                    $inc:{
                        wallet: amount
                    },
                    $push:{
                        walletHistory
                    }
                }
            );

            const updatedUser = await User.findById(userId);
         
            res.json({status: true,wallet:updatedUser.wallet})
        }else{
            res.json({status: false})
        }
  
  
    }catch(error){
      
      next(error)
    }
  }



const submitReview = async (req, res) => {
    try {


        const { productId, rating, comment, userId } = req.body;
      

        // Validate rating
   
        if (rating < 1 || rating > 5) {
            return res.json({ success: false, message: 'Invalid rating. Please select a rating between 1 and 5.' });
        }

        // Find the product by ID
    
        const product = await Product.findById(productId);

        if (!product) {
       
            return res.json({ success: false, message: 'Product not found.' });
        }

        // Check if the user with the provided userId exists
        const user = await User.findById(userId);

        if (!user) {
          
            return res.json({ success: false, message: 'User not found.' });
        }

        const existingReview = product.reviews.find(review => review.user.userId === userId);

        if (existingReview) {
        
            return res.json({ success: false, message: 'You have already reviewed this product.' });
        }

        // Check if the user has a delivered order for the product
        const deliveredOrder = await Order.findOne({
            user: userId,
            'products.product_Id': productId,
            'products.status': 'Delivered',
        });

        if (!deliveredOrder) {
       
            return res.json({ success: false, message: 'You can only review or rate a product after receiving it.' });
        }
 

        // Add the review to the product's reviews array
   
        product.reviews.push({
            
            user: {
                userId: userId,
                firstName: user.firstName,
                lastName: user.lastName,
            },
            rating,
            comment,
            date: new Date(),
        });

      

        // Save the updated product with the new review
      
        await product.save();

        res.json({ success: true, message: 'Review submitted successfully!' });
    } catch (error) {
 
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const editReview = async (req, res) => {
    try {
      

        const { reviewId, productId, rating, comment, userId } = req.body;
       

        // Validate rating
       
        if (rating < 1 || rating > 5) {
            return res.json({ success: false, message: 'Invalid rating. Please select a rating between 1 and 5.' });
        }

        // Find the product by ID
   
        const product = await Product.findById(productId);

        if (!product) {

            return res.json({ success: false, message: 'Product not found.' });
        }

        // Check if the user with the provided userId exists
        const user = await User.findById(userId);

        if (!user) {
          
            return res.json({ success: false, message: 'User not found.' });
        }

        // Check if the review with the provided reviewId exists in the product's reviews array
        const existingReviewIndex = product.reviews.findIndex(review => review._id.toString() === reviewId);

        if (existingReviewIndex === -1) {
          
            return res.json({ success: false, message: 'Review not found.' });
        }

        // Update the existing review in the product's reviews array
        const existingReview = product.reviews[existingReviewIndex];
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.date = new Date();

        

        // Save the updated product with the edited review

        await product.save();

 
        res.json({ success: true, message: 'Review edited successfully!' });
    } catch (error) {
    
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// Add the route for handling edit review requests

// const getInvoice = async (req, res,next) => {
//     try {
//       const orderId = req.params.orderId;
//       console.log("aa:",orderId)
  
//       // Retrieve order details from the database or any other data source
//       const order = await Order.findOne({ _id: orderId })
//         .populate({
//           path: 'products.product_Id',
//         })
//         .sort({ orderDate: -1 });
  
//       // Generate the PDF document
//       const doc = new PDFDocument();
//       doc.pipe(res);
  
//       // Add content to the PDF, including the custom heading
//       doc.text(`Invoice of Order ${order.orderID}`, { align: 'center', fontSize: 16, underline: true });
//       doc.moveDown();
  
//       // Add product details
//       doc.fontSize(12).text('Product Details:', { underline: true });
//       doc.moveDown();
//       order.products.forEach((product) => {
//         doc.text(`Product Name: ${product.product_Id.productName}`);
//         doc.text(`Quantity: ${product.quantity}`);
//         doc.text(`Total: $${product.total}`);
//         doc.moveDown();
//       });
  
//       // Add additional order details
//       doc.fontSize(12).text('Additional Order Details:', { underline: true });
//       doc.moveDown();
//       doc.text(`Order Total Amount: $${order.totalAmount}`);
//       doc.text(`Order Date: ${order.orderDate.toLocaleDateString()}`);
//       // Add more order details as needed...
  
//       // End and finalize the PDF
//       const pdfBuffer = await new Promise((resolve) => {
//         doc.on('end', () => {
//           resolve(doc);
//         });
//         doc.end();
//       });
  
//       // Set response headers for download
//       res.setHeader('Content-Type', 'application/pdf');
//       res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
//       res.status(200).send(pdfBuffer);
//     } catch (err) {
//       next(err)
//     }
//   };
  
const getInvoice = async (req, res, next) => {
    try {
      const orderId = req.params.orderId;
      
  
      // Retrieve order details from the database or any other data source
      const order = await Order.findOne({ _id: orderId })
        .populate({
          path: 'products.product_Id',
        })
        .sort({ orderDate: -1 });
  
      // Generate the PDF document
      const doc = new PDFDocument();
      doc.pipe(res);
  
      // Add content to the PDF, including the custom heading
      doc.text(`Invoice of Order ${order.orderID}`, { align: 'center', fontSize: 16, underline: true });
      doc.moveDown();
  
      // Add delivery address
      doc.fontSize(12).text('Delivery Address:', { underline: true });
      doc.text(order.deliveryAddress);
      doc.moveDown();
  
      // Add product details as a table
      doc.fontSize(12).text('Product Details:', { underline: true });
      doc.moveDown();
  
      // Table header
      doc.font('Helvetica-Bold').text('Product Name', 100, doc.y, { width: 200, align: 'left' });
      doc.text('Quantity', 200, doc.y, { width: 100, align: 'left' });
      doc.text('Total', 300, doc.y, { width: 100, align: 'left' });
      doc.moveDown();
  
      // Table rows
      order.products.forEach((product) => {
        doc.font('Helvetica').text(product.product_Id.productName, 100, doc.y, { width: 200, align: 'left' });
        doc.text(product.quantity.toString(), 300, doc.y, { width: 100, align: 'left' });
  
        // Format total as currency
        const formattedTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(product.total);
        doc.text(formattedTotal, 400, doc.y, { width: 100, align: 'left' });
  
        doc.moveDown();
      });
  
      // Add coupon details
      if (order.coupon) {
        doc.fontSize(12).text('Applied Coupon:', { underline: true });
        doc.text(`Coupon Code: ${order.coupon.code}`);
        doc.text(`Discount: $${order.coupon.discountTotal}`);
        // Add more coupon details as needed...
        doc.moveDown();
      }
  
      // Add additional order details
      doc.fontSize(12).text('Additional Order Details:', { underline: true });
      doc.moveDown();
      const formattedTotalAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.totalAmount);
      doc.text(`Order Total Amount: ${formattedTotalAmount}`);
      doc.text(`Order Date: ${order.orderDate.toLocaleDateString()}`);
      // Add more order details as needed...
  
      // End and finalize the PDF
      const pdfBuffer = await new Promise((resolve) => {
        doc.on('end', () => {
          resolve(doc);
        });
        doc.end();
      });
  
      // Set response headers for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);
      res.status(200).send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  };


  const getBlog = async(req,res,next)=>{

    try{
        
        res.render('blog')
    }
    catch(error){
        
        next(error)
    }
}


const getAbout = async(req,res,next)=>{

    try{
        
        res.render('about')
    }
    catch(error){
        
        next(error)
    }
}
  
const getContact = async(req,res,next)=>{

    try{
        
        res.render('contact')
    }
    catch(error){
        
        next(error)
    }
}
  

const getFaq = async(req,res,next)=>{

    try{
        
        res.render('faq')
    }
    catch(error){
        
        next(error)
    }
}

module.exports = {
    loginLoad,
    loadRegister,
    insertUser,
    showverifyOTPPage,
    verifyOTP, 
    // loadHome,
    verifyLogin,
    loaduserHome,
    // userPoductload,
    forgotLoad,
    forgotVerify,
    forgetPasswordLoad,
    resetPassword,
    userLogout,
    viewProducts,
    resendOTP,
    getProductDetails,
    // searchProducts,
    walletHistory,
    addMoneyWallet,
    verifyWalletpayment,
    // sendVerificationEmail
    submitReview,
    editReview,
    getInvoice,
    // filterPrice,
    // filterCategory
    getBlog,
    getAbout,
    getContact,
    getFaq



}

