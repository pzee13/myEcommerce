const express = require('express'); 
const adminController = require("../controllers/adminController"); 

const session = require('express-session');
const config = require('../config/config');

const multer = require("multer");
const path = require("path");


const auth = require('../middleware/adminAuth') 

const admin_route = express();

admin_route.use(
    session({
      secret: config.sessionSecret,
      resave: false, 
      saveUninitialized:true,
  })
  );


const storage = multer.diskStorage({
    destination:function(req,file,cb){
      cb(null,path.join(__dirname,'../public/adminAssets/assets/images/products'));
    },
    filename:function(req,file,cb) {
      const name = Date.now()+'-'+file.originalname;
      cb(null,name)
    }
  })
   
  const upload = multer({storage:storage});
  

admin_route.set('view engine','ejs');
admin_route.set('views','./views/admin');

admin_route.use(express.json());
admin_route.use(express.urlencoded({ extended: true }));

admin_route.get('/',auth.isLogout,adminController.loadadlogin);

admin_route.get('/login',auth.isLogout,adminController.loadadlogin);

admin_route.post('/',adminController.verifyadlogin)

admin_route.post('/login',adminController.verifyadlogin)

admin_route.get('/logout',auth.isLogin,adminController.adLogout)

admin_route.get('/add_category',auth.isLogin,adminController.loadaddCategory)

admin_route.get('/home',auth.isLogin,adminController.loadadHome)

admin_route.post('/add_category',adminController.addCategory)

admin_route.get('/users',auth.isLogin,adminController.loadusers)

admin_route.get('/view_category',auth.isLogin,adminController.loadviewCategory) 
 
admin_route.get('/unlist_category',auth.isLogin,adminController.unlistCategory)
 
admin_route.get('/edit_category',auth.isLogin,adminController.loadEditCatogories)

admin_route.post('/edit_category',adminController.adeditCategory)

admin_route.get('/view_users',auth.isLogin,adminController.loadviewUsers)

admin_route.get('/block_users',auth.isLogin,adminController.blockUser)
// admin_route.post('/edit_category',adminController.adeditCategory) 

admin_route.get('/add_product',auth.isLogin,adminController.loadaddProducts)

admin_route.post('/add_product',upload.single('image'),adminController.addProduct)

admin_route.get('/view_products',auth.isLogin,adminController.viewProducts)

admin_route.get('/edit_product',auth.isLogin,adminController.loadeditProducts)

admin_route.post('/edit_product',upload.single('image'),adminController.editProduct)

admin_route.get('/unlist_product',auth.isLogin,adminController.unlistProduct)

module.exports = admin_route;   