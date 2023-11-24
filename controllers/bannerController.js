const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Banner = require("../models/bannerModel")
const bcrypt = require('bcrypt')
const path = require("path")
const Cart = require("../models/cartModel")
const Order = require("../models/orderModel")
const fs = require("fs")


const loadAddbanner = async(req,res)=>{
    try{
        res.render('addbanner')
    }catch(error){
        console.log(error.message)
        res.status(500).render('500error');
    }
}


const addBanners = async (req, res) => {
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
      console.error(error);
      res.redirect('/500'); // Redirect to an error page or handle errors appropriately
    }
  };

const loadBanners = async(req,res)=>{
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
        res.status(500).render('500error')
    }
}

const loadEditBanner = async (req, res) => {
    try {
      const bannerId = req.params.id;
      const banner = await Banner.findById(bannerId);
  
      res.render('editbanner', { banner: banner });
    } catch (error) {
      console.error(error);
      res.status(500).render('500error');
    }
  };
  
  // Edit banner
  const editBanner = async (req, res) => {
    try {
      const bannerId = req.params.id;
      console.log("Banner ID:", bannerId);
      console.log("Received Form Data:", req.body);
  
      const updatedBannerData = {
        mainHead: req.body.mainHead,
        typeHead: req.body.type,
        description: req.body.description,
        bannerURL: req.body.bannerURL,
      };
      console.log("Updated Banner Data:", updatedBannerData);
  
      const result = await Banner.findByIdAndUpdate(bannerId, updatedBannerData);
      console.log("MongoDB Update Result:", result);
  
      res.redirect('/admin/banners'); // Redirect to the banners page after editing
    } catch (error) {
      console.error(error);
      res.status(500).render('500error');
    }
  };
  
  const deleteBanner = async (req, res) => {
    try {
      const bannerId = req.params.id;
      await Banner.findByIdAndDelete(bannerId)
      res.redirect('/admin/banners'); // Redirect to the banners page after deleting
    } catch (error) {
      console.error(error);
      res.status(500).render('500error');
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