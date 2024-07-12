const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Banner = require("../models/bannerModel")
const bcrypt = require('bcryptjs')
const path = require("path")
const Cart = require("../models/cartModel")
const Order = require("../models/orderModel")
const fs = require("fs")


const loadAddbanner = async(req,res,next)=>{
    try{
       res.render('addbanner')
    }catch(error){
       
        next(error)
    }
}


const addBanners = async (req,res,next) => {
    try {
      const banner = new Banner({
        mainHead: req.body.mainHead,
        typeHead: req.body.type,
        description: req.body.description,
        image: req.file.filename,
        bannerURL:req.body.bannerURL
      });
      await banner.save();
  
      res.render('addbanner');
    } catch (error) {
      
      next(error) // Redirect to an error page or handle errors appropriately
    }
  };

const loadBanners = async(req,res,next)=>{
    try {
        const search = req.query.search
            let page = Number(req.query.page);
            if (isNaN(page) || page < 1) {
            page = 1;
            }
            const condition = {}

            if ( search ){
                condition.$or = [
                    { typeHead : { $regex : search, $options : "i" }},
                    { mainHead : { $regex : search, $options : "i" }},
                    { description : { $regex : search, $options : "i" }}
                ]
            }
       
        const banners = await Banner.find(condition)
        

        res.render( 'banners',{
            banners : banners,
            admin : req.session.admin,
            search : search
           
            
        })
    }catch(error){
       next(error)
    }
}

const loadEditBanner = async (req,res,next) => {
    try {
      const bannerId = req.params.id;
      const banner = await Banner.findById(bannerId);
  
      res.render('editbanner', { banner: banner });
    } catch (error) {
      
      next(error)
    }
  };
  
  // Edit banner
  const editBanner = async (req,res,next) => {
    try {
      const bannerId = req.params.id;
    
  
      const updatedBannerData = {
        mainHead: req.body.mainHead,
        typeHead: req.body.type,
        description: req.body.description,
        bannerURL: req.body.bannerURL,
      };
 
  
      const result = await Banner.findByIdAndUpdate(bannerId, updatedBannerData);

  
      res.redirect('/admin/banners'); // Redirect to the banners page after editing
    } catch (error) {
      
      next(error)
    }
  };
  
  const deleteBanner = async (req,res,next) => {
    try {
      const bannerId = req.params.id;
      await Banner.findByIdAndDelete(bannerId)
      res.redirect('/admin/banners'); // Redirect to the banners page after deleting
    } catch (error) {
      
      next(error)
    }
  };


module.exports = {
    loadAddbanner,
    addBanners,
    loadBanners,
    loadEditBanner,
    editBanner,
    deleteBanner
}