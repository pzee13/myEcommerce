const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
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

  const loadviewCategory =  async (req, res) => {
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


  const loadviewUsers =  async (req, res) => {
    try {
      const user = await User.find(); 
      res.render('users', { users: user });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error'); 
   }
  };

  const blockUser = async (req, res) => {
    try {
      
      const id = req.query.id;
      const user1 = await User.findById(id);

      if (user1) {
        user1.isBlock = !user1.isBlock 
        await user1.save(); 
        
      }
  
      const users2 = await User.find();
 
      res.render('users', { users: users2 });

    } catch (error) {   
      console.log(error);   
    }
  };


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
      const image = req.file.filename;
  
      console.log("kjhgffg");
      const newProduct = new Product({
        productName:productname,
        category:category,
        size:size,
        description:description,
        price:price,
        image:image,
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

// const addProduct = async (req, res) => {
//   try {
//       const productname = req.body.productname;
//       const category = req.body.category;
//       const size = req.body.size;
//       const description = req.body.description;
//       const price = req.body.price;
//       const quantity = req.body.quantity;

//       if (req.file) {
//           const image = req.file.filename;

//           const newProduct = new Product({
//               productName: productname,
//               category: category,
//               size: size,
//               description: description,
//               price: price,
//               image: image,
//               quantity: quantity,
//           });

//           const productData = await newProduct.save();
//           if (productData) {
//               res.redirect('/admin/view_products');
//           } else {
//               res.render('add_product', { message: "Something went wrong" });
//           }
//       } else {
//           res.render('add_product', { message: "No image file uploaded" });
//       }
//   } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal Server Error');
//   }
// }



const viewProducts = async(req,res) =>{

  try {
    const products = await Product.find().populate("category"); // Populate the category field
    const categories = await Category.find(); // Assuming you want to retrieve all categories from the database
    res.render('viewProduct', { data: products, category: categories });
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

    if (dataproduct) {
      res.render('editProduct', { data: dataproduct }); // Pass the category object to the template
    } else {
      res.redirect('/admin/view_product');
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
}



const editProduct = async(req,res)=>{
  try{
  
    const editData = await Product.findByIdAndUpdate({ _id:req.body.id },{$set:{ productName:req.body.productname, price:req.body.price , quantity:req.body.quantity, description:req.body.description,image:req.file.filename,size:req.body.size}});

    res.redirect('/admin/view_products');

  }catch(error){
    console.log(error.message);
  }
}

// const editProduct = async (req, res) => {
//   try {
//       const editData = await Product.findByIdAndUpdate({ _id: req.body.id }, {
//           $set: {
//               productName: req.body.productname,
//               price: req.body.price,
//               quantity: req.body.quantity,
//               description: req.body.description,
//               size: req.body.size,
//           }
//       });

//       if (req.file) {
//           editData.image = req.file.filename;
//       }

//       const updatedProduct = await editData.save();
//       res.redirect('/admin/view_products');
//   } catch (error) {
//       console.log(error.message);
//       res.status(500).send('Internal Server Error');
//   }
// }

  
const unlistProduct = async (req, res) => {
  try {
    
    const id = req.query.id;
    const product1 = await Product.findById(id);

    if (product1) {
      product1.status = !product1.status 
      await product1.save(); 
      
    }

    const products = await Product.find();

    res.render('viewProduct', { data: products });

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
    loadviewCategory,
    unlistCategory,
    loadEditCatogories,
    adeditCategory,
    loadviewUsers,
    blockUser,
    loadaddProducts,
    addProduct,
    viewProducts,
    loadeditProducts,
    editProduct,
    unlistProduct
    
}   