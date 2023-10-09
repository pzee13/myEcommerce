const User = require('../models/userModels/userModel') 
const nodemailer = require("nodemailer")
const bcrypt = require('bcrypt')
const path = require("path")
const otpGenerator = require("otp-generator")

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

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


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

//   const insertUser = async (req, res) => {
//     try {
        
//         // Generate OTP
//         const otpCode = generateOTP();
//         const otpExpiry = new Date();
//         otpExpiry.setMinutes(otpExpiry.setMinutes() + 1); // OTP expires in 1 minutes

//         const userCheck = await User.findOne({email:req.body.email})
//         if(userCheck)
//         {
//             res.render('registration',{message:"User already exist"});
//         }
//         else{
//             const spassword = await securePassword(req.body.password);
//             req.session.fname = req.body.fname;
//             req.session.lname = req.body.lname;
//             req.session.mobileno = req.body.mobileno;
//             req.session.email = req.body.email;
//             if(req.body.fname && req.body.email && req.session.lname && req.session.mobileno){
//                 if(req.body.password === req.body.cpassword) {
//                     req.session.password = spassword;
//                     req.session.otp = {
//                         code: otpCode,
//                         expiry: otpExpiry,
//                     };        
//                         // Send OTP to the user's email
//                         sendVerificationEmail(req.session.email, req.session.otp.code);
//                         res.render("user-otp")
//                     } else {
//                         res.render("registration",{message: "Password doesn't match"})
//                     }
//                 }
//                 else{
//                     res.render("registration",{message: "Please enter all details"})
//                 }
//                 }
         


//     } catch (error) {
//         console.log(error.message);
//     }
// }

const insertUser = async (req, res) => {
    try {
        
        // Generate OTP
        const otpCode = generateOTP();
        const otpcurTime = Date.now()/1000
        const otpExpiry = otpcurTime + 60

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

// const verifyOTP = async (req, res)=>{
//     try {
//         if(req.body.otp === req.session.otp.code){
//             const currentTime = new Date()
//             if (currentTime <= req.session.otp.expiry) {
//             const user = new User({
//                 firstName: req.session.fname,
//                 lastName: req.session.lname,
//                 email: req.session.email,
//                 mobile: req.session.mobileno,
//                 password: req.session.password,
//                 isVerified:1
//             });

//             const result = await user.save()
//             res.redirect("/login")
//         } else {
//             // OTP has expired, handle accordingly
//             res.render('user-otp', { message: "OTP has expired. Please request a new OTP." });
//         }
//         }
//         else{
//             res.render('user-otp',{message:"invalid OTP"});
//         }
//     } catch (error) {
//         console.log(error.message);
//     }
// }

const verifyOTP = async (req, res)=>{
    try {
        if(req.body.otp === req.session.otp.code){
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


// const resendOTP = async (req,res)=>{
//     try{
//         const currentTime = Date.now()/1000;
//         console.log("current",currentTime)
//         if (req.session.otp.expiry != null) {
//         if(currentTime > req.session.otp.expiry){
//             console.log("expire",req.session.otp.expiry);
//             const newDigit = otpGenerator.generate(6, { 
//                 digits: true,
//                 alphabets: false, 
//                 specialChars: false, 
//                 upperCaseAlphabets: false,
//                 lowerCaseAlphabets: false 
//             });
//                 req.session.otp.code = newDigit;
//                 sendVerificationEmail(req.session.email, req.session.otp.code);
//                 res.render("user-otp",{message:"OTP has been send"});
//             }else{
//                 res.render("user-otp",{message: "You can request a new otp after old otp expires"});
//             }
//         }
//         else{
//             res.send("Please register again")
//         }
//     }
//     catch (error)
//     {
//         console.log(error.message)
//     }
// }

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


                        req.session.userid = userData._id

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

const userPoductload = async (req, res) => {
    try {
      res.render('userProduct');
    } catch (error) {
      console.log(error.message);
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
    userPoductload
    // resendOTP
    // sendVerificationEmail
}

