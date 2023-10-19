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



  // const loadviewUsers =  async (req, res) => {

  //   const page = parseInt(req.query.page) || 1; // Default to page 1
  //   const itemsPerPage = parseInt(req.query.itemsPerPage) || 10; // Default to 10 items per page


  //   try {
    
  //   const usersCount = await User.countDocuments();
  //   const totalPages = Math.ceil(usersCount / itemsPerPage);
  //   const skip = (page - 1) * itemsPerPage;

  //     const user = await User.find().skip(skip).limit(itemsPerPage);

  //     res.render('users', { users: user, page, itemsPerPage, totalPages });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send('Internal Server Error'); 
  //  }
  // };

  // const loadviewUsers = async (req, res) => {
  //   try {
  //     const page = req.query.page || 1; // Get the current page from query parameters or default to 1
  //     const itemsPerPage = 10; // Set your desired page size
  
  //     const skip = (page - 1) * itemsPerPage;
  //     const users = await User.find()
  //       .skip(skip)
  //       .limit(itemsPerPage);
  
  //     const totalUsers = await User.countDocuments();
  //     const totalPages = Math.ceil(totalUsers / itemsPerPage);
  
  //     res.render('users', { users, currentPage: parseInt(page), totalPages });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send('Internal Server Error');
  //   }
  // };
  
  const loadviewUsers = async (req, res) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
      const pageSize = 10; // Set your desired page size
  
      const skip = (page - 1) * pageSize;
      const users = await User.find()
        .skip(skip)
        .limit(pageSize);
  
      const totalUsers = await User.countDocuments();
      const totalPages = Math.ceil(totalUsers / pageSize);
  
      res.render('users', { users, page,totalPages });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };
  
  const searchUsers = async (req, res) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
      const pageSize = 10;
      const skip = (page - 1) * pageSize;

      const searchKeyword = req.query.key; // Get the search keyword from query parameters
  
      // Use a regular expression to perform a case-insensitive search
      const users = await User.find({
        $or: [
          { firstName: { $regex: new RegExp(searchKeyword, 'i') } },
          { lastName: { $regex: new RegExp(searchKeyword, 'i') } },
          { email: { $regex: new RegExp(searchKeyword, 'i') } },
        ],
      }).skip(skip)
      .limit(pageSize);

      const totalUsers = await User.countDocuments();
      const totalPages = Math.ceil(totalUsers / pageSize);
  
  
      res.render('users', { users, page,totalPages });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };


  const blockUser = async (req, res) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
      const pageSize = 10; // Set your desired page size
  
      const id = req.query.id;
      const skip = (page - 1) * pageSize;
      const user1 = await User.findById(id)

      if (user1) {
        user1.isBlock = !user1.isBlock 
        await user1.save(); 
        
      }
  
      const users2 = await User.find().skip(skip).limit(pageSize);
      const totalUsers = await User.countDocuments();
      const totalPages = Math.ceil(totalUsers / pageSize);
 
      res.redirect('/admin/view_users')

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
    adLogout,
    searchUsers
    
}   