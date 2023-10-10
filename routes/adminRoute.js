const express = require('express'); 
const adminController = require("../controllers/adminController"); 
// const session = require('express-session');
// const config = require('../config/config');
// const auth = require('../middleware/adminAuth'); 

const admin_route = express();

// admin_route.use(
//     session({
//       secret: config.sessionSecret,
//       resave: false, 
//       saveUninitialized:true,
//   })
//   );
   

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

// admin_route.post('/login',adminController.verifyLogin);


module.exports = admin_route;