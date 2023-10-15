const express = require("express")
const userController = require("../controllers/userController")
const session = require("express-session")

const config = require("../config/config")

const path = require("path")

const user_route = express()

user_route.set('view engine','ejs')
user_route.set('views','./views/users')

user_route.use(express.json())
user_route.use(express.urlencoded({extended:true}))

user_route.use(session({
    secret:config.sessionSecret,
    resave:false,
    saveUninitialized:true
}))

const auth = require("../middleware/userAuth")

user_route.use('/public',express.static(path.join(__dirname,'../public')))
user_route.use('/userlogin',express.static(path.join(__dirname,'../public/userlogin')))
user_route.use('/assets',express.static(path.join(__dirname,'../public/userlogin/assets')))

user_route.get('/signup',userController.loadRegister)

user_route.post('/signup',userController.insertUser)

user_route.get('/',userController.loaduserHome)

user_route.get('/home',auth.isLogin,userController.loaduserHome)

user_route.get('/login',userController.loginLoad)

user_route.get('/submit-otp', userController.showverifyOTPPage)

user_route.post('/submit-otp', userController.verifyOTP)

user_route.get('/resend-otp', userController.resendOTP) 

user_route.post('/login',userController.verifyLogin)

user_route.get('/forget',userController.forgotLoad)

user_route.post('/forget',userController.forgotVerify)

user_route.get('/forget-password',userController.forgetPasswordLoad)

user_route.get('/forget-password',userController.resetPassword)

// user_route.get('/product',userController.userPoductload)

user_route.get('/logout',auth.isLogin,userController.userLogout)


user_route.get('/product',userController.viewProducts)
 
module.exports = user_route 