const express = require('express'); 
const adminController = require("../controllers/adminController"); 

const session = require('express-session');
const config = require('../config/config');

const multer = require("multer");
const path = require("path");


// const auth = require('../middleware/adminAuth'); 

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

admin_route.get('/',adminController.loadadlogin);

admin_route.get('/login',adminController.loadadlogin);

admin_route.post('/',adminController.verifyadlogin)

admin_route.post('/login',adminController.verifyadlogin)

admin_route.get('/add_category',adminController.loadaddCategory)

admin_route.get('/home',adminController.loadadHome)

admin_route.post('/add_category',adminController.addCategory)

admin_route.get('/users',adminController.loadusers)

admin_route.get('/view_category',adminController.loadviewCategory) 
 
admin_route.get('/unlist_category',adminController.unlistCategory)
 
admin_route.get('/edit_category',adminController.loadEditCatogories)

admin_route.post('/edit_category',adminController.adeditCategory)

admin_route.get('/view_users',adminController.loadviewUsers)

admin_route.get('/block_users',adminController.blockUser)
// admin_route.post('/edit_category',adminController.adeditCategory) 

admin_route.get('/add_product',adminController.loadaddProducts)

admin_route.post('/add_product',upload.single('image'),adminController.addProduct)

admin_route.get('/view_products',adminController.viewProducts)

admin_route.get('/edit_product',adminController.loadeditProducts)

admin_route.post('/edit_product',upload.single('image'),adminController.editProduct)

admin_route.get('/unlist_product',adminController.unlistProduct)

module.exports = admin_route;   