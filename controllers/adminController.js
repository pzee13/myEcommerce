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
      
      const category = await new Category({
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

  const loadusers = async(req,res)=>{
    try{
        res.render("users")
    }
    catch(error)
    {
        console.log(error.message)
    }
  }

  const loadviewCtegory =  async (req, res) => {
    try {
      const categories = await Category.find(); // Assuming you want to retrieve all categories from the database
      res.render('viewCategory', { Category: categories });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
   }
  };


  const unlistCategory = async (req, res) => {
    try {
      
      const id = req.query.id;
      const Category1 = await Category.findById(id);

      if (Category1) {
        Category1.is_listed = !Category1.is_listed 
        await Category1.save(); 
        
      }
  
      const categories = await Category.find();
 
      res.render('viewCategory', { Category: categories });

    } catch (error) {   
      console.log(error);   
    }
  };




  

module.exports = {
    loadadlogin,
    verifyadlogin,
    loadaddCategory,
    loadadHome,
    addCategory,
    loadusers,
    loadviewCtegory,
    unlistCategory
    
}