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

user_route.use('/public',express.static(path.join(__dirname,'../public')))
user_route.use('/assets',express.static(path.join(__dirname,'../public/assets')))

user_route.get('/signup',userController.loadRegister)

user_route.post('/signup',userController.insertUser)

user_route.get('/',userController.loginLoad)

user_route.get('/submit-otp', userController.showverifyOTPPage)

user_route.post('/submit-otp', userController.verifyOTP)

module.exports = user_route