const User = require('../models/userModels/userModel') 
const bcrypt = require('bcrypt')

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

const loginLoad = async(req,res)=>{

    try{
        res.render('login')
    }
    catch(error){
        console.log(error.message)
    }
}

const loadRegister = async(req,res)=>{
    try {
        res.render('registration')
    }
    catch (error)
    {
        console.log(error.message)
    }
}

const insertUser = async(req,res)=>{

    try{
        const spassword = await securePassword(req.body.password)
        const user = new User({
            firstName:req.body.fname,
            lastName:req.body.lname,
            email:req.body.email,
            mobile:req.body.mobileno,
            password:spassword

        })

        const userData = await user.save()

        if(userData)
        {
            res.render('login',{message:"Your registration has been success"})
        }
        else{
            res.render('registration',{message:"Your registration has been failed"})
        }

    }
    catch (error)
    {
        console.log(error.message)
    }
}


module.exports = {
    loginLoad,
    loadRegister,
    insertUser
}

