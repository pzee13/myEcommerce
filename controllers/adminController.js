const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")

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

const loadadlogin = async(req,res)=>{

    try{
        res.render('adlogin')
    }
    catch(error){
        console.log(error.message)
    }
}

const verifyadlogin = async (req, res) => {
    try {
        
        const email = req.body.email;
        const password = req.body.password;
        
    
        const adminData = await Admin.findOne({ email:email })
        if(adminData){
          
    
          const passwordMatch = await bcrypt.compare(password,adminData.password);
    
          if(passwordMatch){   
            req.session.admin_id = adminData._id           
              res.redirect('/admin/home');
            }else{
                res.render('adlogin',{message:"Login details are incorrect" });
              }
    
          }else{
            res.render('adlogin',{message:"Login details are incorrect" });
          }
    
      }catch(error){
        console.log(error.message);
  }
}


const loadadHome = async(req,res)=>{
    try{
        res.render('dashboard')
    }
    catch(error)
    {
        console.log(error.message)
    }
}


  const loadusers = async(req,res)=>{
    try{
        res.render("users")
    }
    catch(error)
    {
        console.log(error.message)
    }
  }



  const loadviewUsers =  async (req, res) => {
    try {
      const user = await User.find(); 
      res.render('users', { users: user });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error'); 
   }
  };



  const blockUser = async (req, res) => {
    try {
      
      const id = req.query.id;
      const user1 = await User.findById(id);

      if (user1) {
        user1.isBlock = !user1.isBlock 
        await user1.save(); 
        
      }
  
      const users2 = await User.find();
 
      res.render('users', { users: users2 });

    } catch (error) {   
      console.log(error);   
    }
  };


const adLogout = async(req,res)=>{

  try{
      req.session.destroy()
      res.redirect('/admin')
  }
  catch (error)
      {
          console.log(error.message)
      }
}

module.exports = {
    loadadlogin,
    verifyadlogin,
    loadadHome,
    loadusers,
    loadviewUsers,
    blockUser,
    adLogout
    
}   