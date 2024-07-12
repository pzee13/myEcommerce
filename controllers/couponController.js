const mongoose = require('mongoose');
const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const bcrypt = require('bcryptjs')
const path = require("path")
const Cart = require("../models/cartModel")
const Order = require("../models/orderModel")
const Coupon =require("../models/couponModel")
const fs = require("fs")



const couponAdmin = async (req, res,next) => {
    try {
      res.render('adcoupon')
    } catch (err) {
    next(err)
 
    }
  }


  const addCoupon = async (req, res, next) => {
    try {
      const code = req.body.code;
  
      const already = await Coupon.aggregate([
        {
          $match: {
            code: code,
          },
        },
        {
          $limit: 1,
        },
      ]);
  
      if (already.length > 0) {
        res.render('adcoupon', { message: 'Code already exists' });
      } else {
        const newCoupon = new Coupon({
          code: req.body.code,
          discountPercentage: req.body.discountPercentage,
          startDate: req.body.startDate,
          expireDate: req.body.expiryDate,
          minimumSpend: req.body.minimumSpend
        });
  
        await newCoupon.save();
        res.redirect('/admin/coupon');
      }
    } catch (err) {
      next(err);
   
    }
  };
  

  const loadCoupon = async (req, res,next) => {
    try {
      const couponData = await Coupon.find()
      res.render('viewCoupon', { couponData })
    } catch (err) {
    next(err)
 
    }
  }


  const deleteCoupon = async (req, res, next) => {
    try {
      const id = req.body.id;
  
      // Using aggregate to match the coupon by ID
      const deletedCoupon = await Coupon.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id)
          }
        },
        {
          $limit: 1
        }
      ]);
  
      // Check if the coupon exists
      if (deletedCoupon.length === 0) {
        return res.json({ success: false, message: 'Coupon not found' });
      }
  
      // Delete the coupon
      await Coupon.deleteOne({ _id: id });
  
      
      res.json({ success: true });
    } catch (err) {
      next(err);
   
    }
  };

  const loadCouponEdit = async (req, res, next) => {
    try {
      const id = req.query.id;
  
      const couponData = await Coupon.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
          },
        },
      ]);
  
      res.render('editCoupon', { data: couponData[0] }); 
    } catch (err) {
      next(err);
   
    }
  };


  const editCoupon = async (req, res, next) => {
    try {
      const id = req.body.id;
      const code = req.body.code;
      const discountPercentage = req.body.discountPercentage;
      const minimumSpend = req.body.minimumSpend;
      const startDate = req.body.startDate;
      const expireDate = req.body.expiryDate;
  
      // Update document based on _id
      await Coupon.updateOne(
        { _id: new mongoose.Types.ObjectId(id) },
        {
          $set: {
            code: code,
            discountPercentage: discountPercentage,
            minimumSpend: minimumSpend,
            startDate: startDate,
            expireDate: expireDate,
          },
        }
      );
  
      res.redirect('/admin/coupon');
    } catch (err) {
      next(err);
   
    }
  };
  
  




module.exports ={
    couponAdmin,
    addCoupon,
    loadCoupon,
    deleteCoupon,
    loadCouponEdit,
    editCoupon
}