const Admin = require("../models/adminModels/adminModel")
const Category = require("../models/categoryModel")
const bcrypt = require('bcrypt')
const path = require("path")

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

const loadaddCategory = async(req,res)=>{
    try{
        res.render('addCategory')
    }
    catch(error)
    {
        console.log(error.message)
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

const addCategory = async (req,res)=>{
    try {
      
      const category =await new Category({
        categoryName:req.body.category_name,
        categoryDescription:req.body.category_description,
        is_listed:true
      })
  
      const result = await category.save()
      
      res.redirect('/admin/add_category')
    } catch (error) {
      console.log(error);
    }
  }

//   const loadusers = async(req,res)=>{
//     try{

//     }
//     catch(error)
//     {

//     }
//   }

module.exports = {
    loadadlogin,
    verifyadlogin,
    loadaddCategory,
    loadadHome,
    addCategory
}