const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const bcrypt = require('bcrypt')
const path = require("path")
const fs = require("fs")

const loadaddProducts = async (req, res) => {
    try {
      // Fetch categories from the database
      const categories = await Category.find();
  
      // Render the addProducts.ejs template with the Category variable
      res.render('addProduct', { Category: categories });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };


  const addProduct = async(req,res)=>{
    try{

      const productname = req.body.productname;
      const category = req.body.category;
      const size = req.body.size
      const description = req.body.description;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const images = []
      for(let i=0;i<req.files.length;i++)
      {
        images[i]=req.files[i].filename
      }
  
      console.log("kjhgffg");
      const newProduct = new Product({
        productName:productname,
        category:category,
        size:size,
        description:description,
        price:price,
        images:images,
        quantity:quantity,
      })
      const productData = await newProduct.save();
    console.log(productData);
    if(productData){
      res.redirect('/admin/view_products');
    }else{
      res.render('add_product',{message:"Something went wrong"});
    }

  }catch(error){
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}





const viewProducts = async(req,res) =>{

  try {
    const page = req.query.page || 1; // Get the current page from query parameters
    const pageSize = 10; // Set your desired page size

    const skip = (page - 1) * pageSize;
        
        const products = await Product.find().populate('category').skip(skip)
        .limit(pageSize);
        
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / pageSize);
     
        
 // Populate the category field
    const categories = await Category.find(); // Assuming you want to retrieve all categories from the database
    res.render('viewProduct', { data:products , category: categories ,
      currentPage: page,
      totalPages: totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}

const loadeditProducts = async (req, res) => {
  try {
    const id = req.query.id;
    console.log("ID:", id);

    const dataproduct = await Product.findById(id);
  //   console.log(category);
     const categories = await Category.find()
    if (dataproduct) {
      res.render('editProduct', { data: dataproduct ,Category:categories}); // Pass the category object to the template
    } else {
      res.redirect('/admin/view_product');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}


const editProduct = async (req, res) => {
  try {
    const id = req.body.id;
    const productname = req.body.productname;
    const category = req.body.category;
    const price = req.body.price;
    const quantity = req.body.quantity;
    const description = req.body.description;
    const size = req.body.size;

    // Check if there are new images
    const newImages = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        newImages.push(req.files[i].filename);
      }
    }

    // Find the existing product
    const existingProduct = await Product.findById(id);

    if (existingProduct) {
      // Update the product details
      existingProduct.productName = productname; // Corrected variable name
      existingProduct.category = category; // Corrected variable name
      existingProduct.price = price;
      existingProduct.quantity = quantity;
      existingProduct.description = description;
      existingProduct.size = size;

      // Add new images, if any
      if (newImages.length > 0) {
        existingProduct.images = existingProduct.images.concat(newImages);
      }

      // Handle image deletion
      if (req.body.deleteImages) {
        console.log('Images to delete:', req.body.deleteImages); // Debugging
        // req.body.deleteImages should be an array of image filenames to delete
        for (const imageToDelete of req.body.deleteImages) {
          console.log('Deleting image:', imageToDelete); // Debugging
          // Remove the deleted image from the existing images
          existingProduct.images = existingProduct.images.filter(
            (image) => image !== imageToDelete
          );

          // Optionally, you can delete the image file from your storage here
          const imagePath = path.join(__dirname, '../public/adminAssets/assets/images/products', imageToDelete);
          console.log('Deleting image file:', imagePath); // Debugging
          fs.unlink(imagePath, (err) => {
            if (err) {
              console.error('Error deleting file:', err);
            }
          });
        }
      }

      const updatedProduct = await existingProduct.save();

      if (updatedProduct) {
        res.redirect('/admin/view_products');
      } else {
        res.render('editProduct', { data: existingProduct, message: 'Failed to update the product' });
      }
    } else {
      res.redirect('/admin/view_products');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

  
const unlistProduct = async (req, res) => {
  try {
    const page = req.query.page || 1; // Get the current page from query parameters
    const pageSize = 10; // Set your desired page size

    const skip = (page - 1) * pageSize;
    
    const id = req.query.id;
    const product1 = await Product.findById(id);

    if (product1) {
      product1.status = !product1.status 
      await product1.save(); 
      
    }

    const products = await Product.find().skip(skip)
    .limit(pageSize);
    
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / pageSize);

    const categories = await Category.find()

    res.redirect('/admin/view_products')

  } catch (error) {   
    console.log(error);   
  }
}

const searchProducts = async (req, res) => {
  try {
    const keyword = req.query.keyword; // Get the search keyword from the query string
    const page = req.query.page || 1; // Get the current page from query parameters
    const pageSize = 10; // Set your desired page size

    // Perform a case-insensitive search on product names and descriptions
    const products = await Product.find({
      $or: [
        { productName: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ],
    })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('category'); // Populate the category field

    const totalProducts = await Product.countDocuments({
      $or: [
        { productName: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ],
    });
    const totalPages = Math.ceil(totalProducts / pageSize);

    // Fetch categories for the sidebar
    const categories = await Category.find();

    res.render('viewProduct', {
      data: products,
      category: categories,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
    loadaddProducts,
    addProduct,
    viewProducts,
    loadeditProducts,
    editProduct,
    unlistProduct,
    searchProducts
}
