const User = require('../models/userModels/userModel') 
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const nodemailer = require("nodemailer")
const bcrypt = require('bcrypt')
const randomstring = require('randomstring')
const path = require("path")
const otpGenerator = require("otp-generator")
const Cart = require('../models/cartModel')


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


const sendVerificationEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'aswinpc9@gmail.com',
                pass: 'monq qcbh bhdy elod',
            },
        });

        const mailOptions = {
            from: 'aswinpc9@gmail.com',
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error.message);
    }
}

const resetPasswordMail = async(firstName,lastName,email, token)=>{
    try 
        {
            const transporter = nodemailer.createTransport({
                host:'smtp.gmail.com',
                port:587,
                secure:false,
                requireTLS:true,
                auth:{
                    user:'aswinpc9@gmail.com',
                    pass:'monq qcbh bhdy elod',
                },
            })
            const mailOptions = {
                from:'aswinpc9@gmail.com',
                to:email,
                subject:'For Reset Password',
                html: `<p> Hi, ${firstName} ${lastName}, please click here to <a href="http://127.0.0.1:4000/forget-password?token=${token}"> Reset </a> your password</p>`
            }
            transporter.sendMail(mailOptions,function(error,info){
                if(error)
                    {
                        console.log(error)
                    }
                else
                    {
                        console.log("Email has been sent:-",info.response)
                    }
            })
        }
    catch (error)
        {
            console.log(error.message)
        }
}


const loginLoad = async(req,res)=>{

    try{
        
        res.render('login')
    }
    catch(error){
        console.log(error.message)
    }
}

// const loadHome = async (req, res) => {
//     try {
//       res.redirect('/');
//     } catch (error) {
//       console.log(error.message);
//     }
//   }

const loadRegister = async(req,res)=>{
    try {
        res.render('registration')
    }
    catch (error)
    {
        console.log(error.message)
    }
}


const showverifyOTPPage = async (req, res) => {
    try {
      res.render('user-otp');
    } catch (error) {
      console.log(error.message);
    }
  }


const insertUser = async (req, res) => {
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
        console.log(error.message);
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
                password: req.session.password,
                isVerified:1
            });

            const result = await user.save()
            res.redirect("/login")
        }
        else{
            res.render('user-otp',{message:"invalid OTP"});
        }
    } catch (error) {
        console.log(error.message);
    }
}


const resendOTP = async (req,res)=>{
    try{
        const currentTime = Date.now()/1000;
        console.log("current",currentTime)
        if (req.session.otp.expiry != null) {
        if(currentTime > req.session.otp.expiry){
            console.log("expire",req.session.otp.expiry);
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
        console.log(error.message)
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
    }
}

const loaduserHome = async (req, res) => {
    try {
      
      res.render('userHome');
        
    } catch (error) {
      console.log(error.message);
    }
  }


// const userPoductload = async (req, res) => {
//     try {
//       res.render('userProduct');
//     } catch (error) {
//       console.log(error.message);
//     }
//   }

  const forgotLoad = async(req,res)=>{
    try{
        res.render('forgot')
    }
    catch(error)
    {
        console.log(error.message);
    }
  }
  
  const forgotVerify = async(req,res)=>{
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
        console.log(error.message);
    }
  }


  const forgetPasswordLoad = async(req,res)=>{

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
        console.log(error.message)
    }
  }

  const resetPassword = async(req,res)=>{
    try{
        const password = req.body.password
        const user_id = req.body.user_id

        const spassword = await securePassword(password)

        const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{ password:spassword, token:''}})

        res.redirect('/login')

    }
    catch(error){
        console.log(error.message);
    }
    
  }


  const userLogout = async(req,res)=>{

    try
    {
        req.session.destroy()
        res.redirect('/')
    }
    catch (error)
    {
        console.log(error.message)
        res.status(500).send('Server Error');
        return
    }
}

const viewProducts = async (req, res) => {
    try {
        const page = req.query.page || 1; // Get the current page from query parameters
        const pageSize = 10; // Set your desired page size
    
        const skip = (page - 1) * pageSize;
      const products = await Product.find({ status: 1 }).populate('category') .skip(skip)
      .limit(pageSize);

      const totalProducts = await Product.countDocuments();
      const totalPages = Math.ceil(totalProducts / pageSize);

      const categories = await Category.find()
      res.render('userProduct', { product: products , category:categories,
        currentPage: page,
        totalPages: totalPages});
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }



  const getProductDetails = async (req, res) => {
    try {
        const id = req.query.id; // You should adjust this based on your route structure
        const product = await Product.findById({_id:id}).populate('category');

        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }

        res.render('productDetails', { product:product});
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Internal Server Error' });
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
//         console.error(error);
//         res.status(500).render('error', { message: 'Internal Server Error' });
//     }
// };


const searchProducts = async (req, res) => {
    try {
      const keyword = req.query.keyword; // Get the search keyword from the query string
      const page = req.query.page || 1; // Get the current page from query parameters
      const pageSize = 10; // Set your desired page size
  
      // Perform a case-insensitive search on product names and descriptions
      const products = await Product.find({
        $or: [
          { productName: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ],
      })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate('category'); // Populate the category field
  
      const totalProducts = await Product.countDocuments({
        $or: [
          { productName: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
        ],
      });
      const totalPages = Math.ceil(totalProducts / pageSize);
  
      // Fetch categories for the sidebar
      const categories = await Category.find();
  
      res.render('userProduct', {
        product: products,
        category: categories,
        currentPage: page,
        totalPages: totalPages,
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };

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
    searchProducts,
    // sendVerificationEmail
}

