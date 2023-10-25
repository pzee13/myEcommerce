const express = require("express")
const userController = require("../controllers/userController")
const cartController = require("../controllers/cartController")
// const cart2Controller = require("../controllers/cart2Controller")
// // const cart3Controller = require("../controllers/cart3Controller") 
const wishlistController = require("../controllers/wishlistController")
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

user_route.post('/forget-password',userController.resetPassword)

// user_route.get('/product',userController.userPoductload)

user_route.get('/logout',auth.isLogin,userController.userLogout)


user_route.get('/product',userController.viewProducts) 

user_route.get('/search_product',userController.searchProducts)

user_route.get('/productDetails', userController.getProductDetails)

user_route.get('/cart',auth.isLogin,cartController.loadCart)

user_route.post('/cart',cartController.addCart)

user_route.patch('/update_quantity/:id/:quantity',cartController.updateQuantity)

user_route.patch('/update_cart',cartController.updateCart);

user_route.get('/cart_remove',auth.isLogin,cartController.cartRemove)

user_route.get('/wish_list',auth.isLogin,wishlistController.loadWishlist)

user_route.post('/wish_list',auth.isLogin,wishlistController.addToWishlist)

user_route.get('/remove_wishlist',wishlistController.removeFromWishlist)

// user_route.get('/updated_wishlist_data',wishlistController.updatelist)

// user_route.get('/cart', auth.isLogin, cart2Controller.loadCart);
// user_route.post('/cart',cart2Controller.addCart);
// user_route.patch('/update_quantity/:id/:quantity',cart2Controller.updateQuantity);
// user_route.patch('/update_cart',cart2Controller.updateCart);

module.exports = user_route 