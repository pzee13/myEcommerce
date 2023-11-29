const express = require("express")
const userController = require("../controllers/userController")
const cartController = require("../controllers/cartController")
// const cart2Controller = require("../controllers/cart2Controller")
// // const cart3Controller = require("../controllers/cart3Controller") 
const wishlistController = require("../controllers/wishlistController")
const profileController  = require("../controllers/profileController")
const checkoutController = require("../controllers/checkoutController")
const orderController = require("../controllers/orderController")

const errorHandler =require('../middleware/errHandler')
const fetchUserData = require("../middleware/userData")
const fetchCartData =require("../middleware/cartCount")
const fetchWislistData = require("../middleware/wishlistCount")
const auth = require("../middleware/userAuth")

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



user_route.use('/public',express.static(path.join(__dirname,'../public')))
user_route.use('/userlogin',express.static(path.join(__dirname,'../public/userlogin')))
user_route.use('/assets',express.static(path.join(__dirname,'../public/userlogin/assets')))



user_route.use(fetchUserData)


user_route.use(fetchCartData)


user_route.use(fetchWislistData)

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

// user_route.get('/search_product',userController.searchProducts)

user_route.get('/filter_by_price',userController.filterPrice)

user_route.get('/filter_by_category',userController.filterCategory)

user_route.get('/productDetails', userController.getProductDetails)

user_route.get('/cart',auth.isLogin,cartController.loadCart)

user_route.post('/cart',cartController.addCart)

user_route.patch('/update_quantity/:id/:quantity',cartController.updateQuantity)

user_route.patch('/update_cart',cartController.updateCart);

user_route.get('/cart_remove',auth.isLogin,cartController.cartRemove)

user_route.get('/wish_list',auth.isLogin,wishlistController.loadWishlist)

user_route.post('/wish_list',auth.isLogin,wishlistController.addToWishlist)

user_route.get('/remove_wishlist',wishlistController.removeFromWishlist)

user_route.get('/profile',auth.isLogin,profileController.loadProfile)

user_route.post('/update_profile',auth.isLogin,profileController.updateProfile)

user_route.post('/change_password',auth.isLogin,profileController.changePassword)

user_route.post('/add_address',profileController.addAddress)

user_route.post('/edit_address',profileController.EditAddress)

user_route.delete('/delete_address/:addressId',auth.isLogin,profileController.deleteAddress)

user_route.get('/checkout',auth.isLogin,checkoutController.loadCheckout0)

user_route.post('/checkout_address',checkoutController.addAddressForCheckout)

user_route.post('/place_order',orderController.placeOrder)

user_route.get('/order_placed',auth.isLogin,orderController.loadOrderPlaced)

user_route.get('/orders',auth.isLogin,orderController.loadOrder)

user_route.get('/order_details',auth.isLogin,orderController.orderDetails)

user_route.post('/cancel_order/:orderId/:productId', orderController.cancelOrder);

user_route.post('/return_order/:orderId/:productId', orderController.orderReturn);

user_route.post('/verify_payment',auth.isLogin,orderController.validatePaymentVerification)

user_route.get('/wallet_history',auth.isLogin,userController.walletHistory)

user_route.get('/wallet',auth.isLogin,profileController.loadWallet)

user_route.post('/add_wallet',auth.isLogin,userController.addMoneyWallet)

user_route.post('/verify_wallet',auth.isLogin,userController.verifyWalletpayment)

user_route.post('/apply_coupon',auth.isLogin,orderController.couponCheck)

user_route.post('/remove_coupon',auth.isLogin,orderController.removeCoupon)

// user_route.post('/persist_coupon',auth.isLogin,orderController.persistCoupon)

// user_route.post('/remove_persisted_coupon',auth.isLogin,orderController.removePersistCoupon)

user_route.post('/submit_review',auth.isLogin,userController.submitReview)

user_route.post('/edit_review',auth.isLogin,userController.editReview)

user_route.get('/download-invoice/:orderId',auth.isLogin,userController.getInvoice)


user_route.use(errorHandler); 

user_route.get('*',(req,res)=>{
    console.log(req.url)
    res.render('404error')
  })


module.exports = user_route 