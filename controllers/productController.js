const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Offer = require("../models/offerModel")
const bcrypt = require('bcryptjs')
const path = require("path")
const fs = require("fs")

const loadaddProducts = async (req, res,next) => {
    try {
      // Fetch categories from the database
      const categories = await Category.find({is_listed:true});
  
      // Render the addProducts.ejs template with the Category variable
      res.render('addProduct', { Category: categories });
      
    } catch (error) {
   
     next(error)
    }
  };


  const addProduct = async (req, res, next) => {
    try {
      const productname = req.body.productname;
      const category = req.body.category;
      const size = req.body.size;
      const description = req.body.description;
      const price = req.body.price;
      const quantity = req.body.quantity;
      const images = [];
  
      for (let i = 0; i < req.files.length; i++) {
        const croppedImageData = req.body['croppedImageData' + (i + 1)];
        const imageBuffer = Buffer.from(croppedImageData.replace(/^data:image\/jpeg;base64,/, ''), 'base64');
        const filename = `image_${Date.now()}_${i + 1}.jpg`;
        const imagePath = path.join(__dirname, '../public/adminAssets/assets/images/products/', filename);
  
        // Write the image buffer to the file
        fs.writeFileSync(imagePath, imageBuffer);
  
        // Store the filename or path in the images array
        images.push(filename);
      }
  
      const newProduct = new Product({
        productName: productname,
        category: category,
        size: size,
        description: description,
        price: price,
        images: images,
        quantity: quantity,
      });
  
      const productData = await newProduct.save();
    
  
      if (productData) {
        res.redirect('/admin/view_products');
      } else {
        res.render('add_product', { message: 'Something went wrong' });
      }
    } catch (error) {
      next(error);
    }
  };
  




const viewProducts = async(req,res,next) =>{

  try {
    const page = req.query.page || 1; // Get the current page from query parameters
    const pageSize = 5; // Set your desired page size

    const skip = (page - 1) * pageSize;
        const products = await Product.find().populate('category').populate('offer').skip(skip)
        .limit(pageSize);
        
        const totalProducts = await Product.countDocuments();
        const totalPages = Math.ceil(totalProducts / pageSize);
     
        
 // Populate the category field
 const availableOffers = await Offer.find({ status : true, expiryDate : { $gte : new Date() }})
    const categories = await Category.find({is_listed:true}); // Assuming you want to retrieve all categories from the database
    res.render('viewProduct', { data:products , category: categories ,
      currentPage: page,
      totalPages: totalPages,
      availableOffers:availableOffers });
  } catch (error) {
 
    next(error)
  }
}

const loadeditProducts = async (req, res,next) => {
  try {
    const id = req.query.id;
   

    const dataproduct = await Product.findById(id);

     const categories = await Category.find({is_listed:true})
    if (dataproduct) {
      res.render('editProduct', { data: dataproduct ,Category:categories}); // Pass the category object to the template
    } else {
      res.redirect('/admin/view_product');
    }
  } catch (error) {

    next(error)
  }
}


const editProduct = async (req, res,next) => {
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
   // Debugging
        // req.body.deleteImages should be an array of image filenames to delete
        for (const imageToDelete of req.body.deleteImages) {
    // Debugging
          // Remove the deleted image from the existing images
          existingProduct.images = existingProduct.images.filter(
            (image) => image !== imageToDelete
          );

          // Optionally, you can delete the image file from your storage here
          const imagePath = path.join(__dirname, '../public/adminAssets/assets/images/products', imageToDelete);
           // Debugging
          fs.unlink(imagePath, (err) => {
            if (err) {
              
              next(err)
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
 
    next(error)
  }
};

  
const unlistProduct = async (req, res,next) => {
  try {
    const page = req.query.page || 1; // Get the current page from query parameters
    const pageSize = 5; // Set your desired page size

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
      
    next(error)
  }
}

const searchProducts = async (req, res,next) => {
  try {
    const keyword = req.query.keyword; // Get the search keyword from the query string
    const page = req.query.page || 1; // Get the current page from query parameters
    const pageSize = 5; // Set your desired page size

    // Perform a case-insensitive search on product names and descriptions
    const products = await Product.find({
      $or: [
        { productName: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ],
    })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate('category').populate('offer'); // Populate the category field

    const totalProducts = await Product.countDocuments({
      $or: [
        { productName: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ],
    });
    const totalPages = Math.ceil(totalProducts / pageSize);

    // Fetch categories for the sidebar
    const categories = await Category.find();

    const availableOffers = await Offer.find({ status : true, expiryDate : { $gte : new Date() }})

    res.render('viewProduct', {
      data: products,
      category: categories,
      currentPage: page,
      totalPages: totalPages,
      availableOffers:availableOffers
    });
  } catch (error) {
 
    next(error)
  }
};

// const applyProductOffer = async ( req, res ) => {
//   try {
//       const productId= req.body.productId
//       const offerId=req.body.offerId
//       console.log(offerId)
//       console.log(productId)
//       await Product.updateOne({ _id : productId },{
//           $set : {
//               offer : offerId
//           }
//       })

//       const offer = await Product.findOne({ _id : productId }).populate('offer')
//       res.json({ success : true,offer})
//   } catch (error) {
//     console.log(error.message)
//       res.redirect('/500')

//   }
// }

// const applyProductOffer = async (req, res) => {
//   try {
//     const productId = req.body.productId;
//     const offerId = req.body.offerId;

//     const offer = await Offer.findOne({ _id: offerId });

//     if (!offer) {
//       return res.json({ success: false, message: 'Offer not found' });
//     }

//     const product = await Product.findOne({ _id: productId });

//     if (!product) {
//       return res.json({ success: false, message: 'Product not found' });
//     }

//     const discountPercentage = parseFloat(offer.percentage);
//     console.log("discountPercentage:",discountPercentage)
//     const cleanedPrice = product.price.replace(/[^\d.]/g, ''); // Remove non-numeric characters
//     console.log("cp:",cleanedPrice)
//     console.log("product.price:",product.price)

//     // Check if the cleaned price is a valid number
//     if (isNaN(cleanedPrice)) {
//       return res.json({ success: false, message: 'Invalid price format' });
//     }

//     const originalPrice = parseFloat(cleanedPrice);
//     console.log("originalPrice:",originalPrice) // Use parseFloat for better handling of decimal values
//     const discountedPrice = originalPrice - (originalPrice * discountPercentage) / 100;
//     console.log("discountedPrice:",discountedPrice)

//     // Update product with offer details
//     await Product.updateOne(
//       { _id: productId },
//       {
//         $set: {
//           offer: offerId,
//           discountedPrice: discountedPrice,
//         },
//       }
//     );

//     const updatedProduct = await Product.findOne({ _id: productId }).populate('offer');
//     res.json({ success: true, data: updatedProduct });
//   } catch (error) {
// 
//    next(error)
//   }
// };

const applyProductOffer = async (req, res,next) => {
  try {
    const productId = req.body.productId;
    const offerId = req.body.offerId;

    // Assuming you have an Offer model with fields: discountPercentage
    const offer = await Offer.findOne({ _id: offerId });

    if (!offer) {
      return res.json({ success: false, message: 'Offer not found' });
    }

    const product = await Product.findOne({ _id: productId }).populate('category')

    if (!product) {
      return res.json({ success: false, message: 'Product not found' });
    }

    // Get the category discount, if available
    const categoryDiscount = product.category && product.category.offer
      ? await Offer.findOne({ _id: product.category.offer })
      : 0;


    // Calculate real price and discounted price for the product
    const discountPercentage = offer.percentage;
    const originalPrice = parseFloat(product.price);
    const discountedPrice = originalPrice - (originalPrice * discountPercentage) / 100;


    // Check if category offer is available and its discount is greater than product offer
    if (categoryDiscount && categoryDiscount.percentage > discountPercentage) {
    
      // You can handle this case as needed, e.g., not applying the product offer
      return res.json({ success: false, message: 'Category offer has greater discount' });
    }

    // Update product with offer details
    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          offer: offerId,
          discountedPrice: discountedPrice,
        },
      }
    );

    const updatedProduct = await Product.findOne({ _id: productId }).populate('offer');
    res.json({ success: true, data: updatedProduct });
  } catch (error) {

   next(error)
  }
};

// const removeProductOffer = async ( req, res ) => {
//   try {
//       const { productId } = req.body
//       const remove = await Product.updateOne({ _id : productId },{
//           $unset : {
//               offer : ""
//           }
//       })
//       res.json({ success : true })
//   } catch (error) {
//     console.log(error)
//       res.redirect('/500')

//   }
// }

const removeProductOffer = async (req, res,next) => {
  try {
    const { productId } = req.body;

    const remove = await Product.updateOne(
      { _id: productId },
      {
        $unset: {
          offer: '',
          discountedPrice: '',
        },
      }
    );

    res.json({ success: true ,data:remove });
  } catch (error) {
   
   next(error)
  }
};




module.exports = {
    loadaddProducts,
    addProduct,
    viewProducts,
    loadeditProducts,
    editProduct,
    unlistProduct,
    searchProducts,
    applyProductOffer,
    removeProductOffer,
  
}
