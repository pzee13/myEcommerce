const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")


const loadaddCategory = async(req,res)=>{
    try{
        res.render('addCategory')
    }
    catch(error)
    {
        console.log(error.message)
    }
}

const addCategory = async (req,res)=>{
    try {
      const categoryname=req.body.category_name
        const already=await Category.findOne({categoryName:{$regex:categoryname,'$options':'i'}})
        if(already){
            res.render('addCategory',{message : "Category Already Created"})
        }else{
        //  const data=new Category({
        //     categoryname:categoryname,
        //     isListed:true
        //  })

      const category = await new Category({
        categoryName:req.body.category_name,
        categoryDescription:req.body.category_description,
        is_listed:true
      })
      
      const result = await category.save()
      
      res.redirect('/admin/add_category')
    }} catch (error) {
      console.log(error);
    }
  }

  const loadviewCategory =  async (req, res) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
        const pageSize = 8; // Set your desired page size

        const skip = (page - 1) * pageSize;
        const categories = await Category.find()
            .skip(skip)
            .limit(pageSize);

        // Calculate the total number of pages
        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / pageSize);

      res.render('viewCategory', { Category: categories ,currentPage: page, totalPages });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
   }
  };

  const unlistCategory = async (req, res) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
        const pageSize = 8; // Set your desired page size


      const id = req.query.id;
      const Category1 = await Category.findById(id);

      if (Category1) {
        Category1.is_listed = !Category1.is_listed 
        await Category1.save(); 
        
      }
      const skip = (page - 1) * pageSize;
      const categories = await Category.find().skip(skip)
      .limit(pageSize);

      const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / pageSize);
        res.redirect('/admin/view_category');

    } catch (error) {   
      console.log(error);   
    }
  };


  const loadEditCatogories = async (req, res) => {
    try {
      const id = req.query.id;
      console.log("ID:", id);
  
      const datacategory = await Category.findById(id);
    //   console.log(category);
  
      if (datacategory) {
        res.render('editCategory', { category: datacategory }); // Pass the category object to the template
      } else {
        res.redirect('/admin/view_category');
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  }
  

  const adeditCategory = async(req,res) => {

    try{
  
      const editData = await Category.findByIdAndUpdate({ _id:req.body.id },{$set:{ categoryName:req.body.categoryname, categoryDescription:req.body.categorydes }});
  
      res.redirect('/admin/view_category');
  
    }catch(error){
      console.log(error.message);
    }
  }

  module.exports = {
    loadaddCategory,
    addCategory,
    loadviewCategory,
    unlistCategory,
    loadEditCatogories,
    adeditCategory
  }
