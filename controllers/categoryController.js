const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Offer = require("../models/offerModel")
const Product = require("../models/productModel")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")


const loadaddCategory = async(req,res,next)=>{
    try{
        res.render('addCategory')
    }
    catch(error)
    {
        
        next(error)
    }
}

const addCategory = async (req,res,next)=>{
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
     
      next(error)
    }
  }

  const loadviewCategory =  async (req,res,next) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
        const pageSize = 5; // Set your desired page size

        const skip = (page - 1) * pageSize;
        const categories = await Category.find().populate('offer')
            .skip(skip)
            .limit(pageSize);

        // Calculate the total number of pages
        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories / pageSize);
        const availableOffers = await Offer.find({ status : true, expiryDate : { $gte : new Date() }})
      res.render('viewCategory', { Category: categories ,currentPage: page, totalPages,availableOffers:availableOffers });
    } catch (error) {
   
      next(error)
   }
  };

  const unlistCategory = async (req,res,next) => {
    try {
      const page = req.query.page || 1; // Get the current page from query parameters
        const pageSize = 5; // Set your desired page size


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
 
      next(error) 
    }
  };


  const loadEditCatogories = async (req,res,next) => {
    try {
      const id = req.query.id;
    
  
      const datacategory = await Category.findById(id);

  
      if (datacategory) {
        res.render('editCategory', { category: datacategory }); // Pass the category object to the template
      } else {
        res.redirect('/admin/view_category');
      }
    } catch (error) {
      
      next(error)
    }
  }
  

  const adeditCategory = async(req,res,next) => {

    try{
  
      const editData = await Category.findByIdAndUpdate({ _id:req.body.id },{$set:{ categoryName:req.body.categoryname, categoryDescription:req.body.categorydes }});
  
      res.redirect('/admin/view_category');
  
    }catch(error){
      
      next(error)
    }
  }

//  const applyCategoryOffer =  async ( req,res,next ) => {
//     try {
//         const { offerId, categoryId } = req.body
//         await Category.updateOne({ _id : categoryId },{
//             $set : {
//                 offer : offerId 
//             }
//         })
//         res.json({ success : true })
//     } catch (error) {
//       
//         res.redirect('/500')

//     }
//   }

  const applyCategoryOffer = async (req,res,next) => {
    try {
      const { offerId, categoryId } = req.body;
  
      // Get the category discount
      const categoryOffer = await Offer.findOne({ _id: offerId });
  
      if (!categoryOffer) {
        return res.json({ success: false, message: 'Category Offer not found' });
      }
  
      // Update the category with the offer
      await Category.updateOne({ _id: categoryId }, { $set: { offer: offerId } });
  
      // Update discounted prices for all products in the category
      const productsInCategory = await Product.find({ category: categoryId });
  
      for (const product of productsInCategory) {
        const productOffer = product.offer ? await Offer.findOne({ _id: product.offer }) : null;
  
        // Check if the product has no offer or the category offer has a greater discount
        if (!product.offer || (productOffer && productOffer.percentage < categoryOffer.percentage)) {
          const originalPrice = parseFloat(product.price);
          const discountedPrice = originalPrice - (originalPrice * categoryOffer.percentage) / 100;
  
          // Update the product with the category offer details
          await Product.updateOne(
            { _id: product._id },
            {
              $set: {
                offer: offerId,
                discountedPrice: discountedPrice,
              },
            }
          );
        }
      }
  
      res.json({ success: true });
    } catch (error) {
      
      next(error)
    }
  };

  // const removeCategoryOffer = async ( req,res,next ) => {
  //   try {
  //       const { categoryId } = req.body
  //       await Category.updateOne({ _id : categoryId}, {
  //           $unset : {
  //               offer : ""
  //           }
  //       })
  //       res.json({ success : true })
  //     } catch (error) {
  //       
  //         res.redirect('/500')

  //     }
  // }

  // const removeCategoryOffer = async (req,res,next) => {
  //   try {
  //     const { categoryId } = req.body;
  
  //     // Update category to remove the offer
  //     await Category.updateOne({ _id: categoryId }, { $unset: { offer: '' } });
  
  //     // Update all products in the category to remove offer details and reset discounted prices
  //     const productsInCategory = await Product.find({ category: categoryId });
  
  //     for (const product of productsInCategory) {
  //       await Product.updateOne(
  //         { _id: product._id },
  //         {
  //           $unset: {
  //             offer: '',
  //             discountedPrice: '',
  //           },
  //         }
  //       );
  //     }
  
  //     res.json({ success: true });
  //   } catch (error) {
  //     
  //     next(error)
  //   }
  // };
  

  const removeCategoryOffer = async (req,res,next) => {
    try {
      const { categoryId } = req.body;
  
      // Get the category offer
      const category = await Category.findById(categoryId).populate('offer');
  
      if (!category) {
        return res.json({ success: false, message: 'Category not found' });
      }
  
      // Update category to remove the offer
      await Category.updateOne({ _id: categoryId }, { $unset: { offer: '' } });
  
      // Update all products in the category to remove offer details and reset discounted prices
      const productsInCategory = await Product.find({ category: categoryId });
  
      for (const product of productsInCategory) {
        if (product.offer) {
          const productOffer = await Offer.findById(product.offer);
  
          // Check if the product has a greater discount than the category's offer
          if (productOffer && productOffer.percentage > category.offer.percentage) {
            continue; // Skip this product, as it has a greater discount
          }
        }
  
        // Remove the offer and reset discounted prices for the product
        await Product.updateOne(
          { _id: product._id },
          {
            $unset: {
              offer: '',
              discountedPrice: '',
            },
          }
        );
      }
  
      res.json({ success: true });
    } catch (error) {
      
      next(error)
    }
  };
  



  module.exports = {
    loadaddCategory,
    addCategory,
    loadviewCategory,
    unlistCategory,
    loadEditCatogories,
    adeditCategory,
    applyCategoryOffer,
    removeCategoryOffer
  }
