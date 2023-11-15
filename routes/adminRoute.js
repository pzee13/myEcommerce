const express = require('express'); 
const adminController = require("../controllers/adminController"); 
const categoryController =require("../controllers/categoryController")
const productController = require("../controllers/productController")
const couponController = require("../controllers/couponController")
const salesController = require("../controllers/salesController")
const dashboardController = require("../controllers/dasboardController")
const bannerController = require("../controllers/bannerController")
const session = require('express-session');
const config = require('../config/config');
const mult = require('../middleware/multer')



const auth = require('../middleware/adminAuth') 

const admin_route = express();

admin_route.use(
    session({
      secret: config.sessionSecret,
      resave: false, 
      saveUninitialized:true,
  })
  );


  

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

admin_route.get('/',auth.isLogout,adminController.loadadlogin);

admin_route.get('/login',auth.isLogout,adminController.loadadlogin);

admin_route.post('/',adminController.verifyadlogin)

admin_route.post('/login',adminController.verifyadlogin)

admin_route.get('/logout',auth.isLogin,adminController.adLogout)

admin_route.get('/add_category',auth.isLogin,categoryController.loadaddCategory)

// admin_route.get('/home',auth.isLogin,adminController.loadadHome)

admin_route.post('/add_category',categoryController.addCategory)

admin_route.get('/users',auth.isLogin,adminController.loadusers)

admin_route.get('/view_category',auth.isLogin,categoryController.loadviewCategory) 
 
admin_route.get('/unlist_category',auth.isLogin,categoryController.unlistCategory)
 
admin_route.get('/edit_category',auth.isLogin,categoryController.loadEditCatogories)

admin_route.post('/edit_category',categoryController.adeditCategory)

admin_route.get('/view_users',auth.isLogin,adminController.loadviewUsers)

admin_route.get('/searchUsers', adminController.searchUsers)

admin_route.get('/block_users',auth.isLogin,adminController.blockUser)
// admin_route.post('/edit_category',adminController.adeditCategory) 

admin_route.get('/add_product',auth.isLogin,productController.loadaddProducts)

admin_route.post('/add_product',mult.upload.array('images[]',3),productController.addProduct)

admin_route.get('/view_products',auth.isLogin,productController.viewProducts)

admin_route.get('/edit_product',auth.isLogin,productController.loadeditProducts)

admin_route.post('/edit_product',mult.upload.array('images',3),productController.editProduct)

admin_route.get('/unlist_product',auth.isLogin,productController.unlistProduct)

admin_route.get('/search_product',auth.isLogin,productController.searchProducts)

admin_route.get('/add_order',auth.isLogin,adminController.loadorders)

admin_route.get('/adorder_details',auth.isLogin,adminController.adorderDetails)

admin_route.patch('/OrderUpdate',auth.isLogin,adminController.updateOrderStatus)

admin_route.post('/cancel_order/:orderId/:productId',auth.isLogin,adminController.cancelOrder)

admin_route.get('/adcoupon',auth.isLogin,couponController.couponAdmin)

admin_route.post('/add_coupon',auth.isLogin,couponController.addCoupon)

admin_route.get('/coupon',auth.isLogin,couponController.loadCoupon)

admin_route.delete('/delete_coupon',auth.isLogin,couponController.deleteCoupon)

admin_route.get('/edit_coupon',auth.isLogin,couponController.loadCouponEdit)

admin_route.post('/edit_coupon',auth.isLogin,couponController.editCoupon)

admin_route.get('/home',auth.isLogin,dashboardController.loadDashboard)

admin_route.get('/sales_report',auth.isLogin,salesController.getSalesReport)

admin_route.get('/add_banner',auth.isLogin,bannerController.loadAddbanner)

admin_route.post('/add_banner',mult.upload.single('image'),auth.isLogin,bannerController.addBanners)

admin_route.get('/banners',auth.isLogin,bannerController.loadBanners)

admin_route.get('/500',adminController.load500)

admin_route.get('/*',adminController.load404)

module.exports = admin_route;   