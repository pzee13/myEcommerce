
const Cart = require("../models/cartModel")

const fetchCartData = async (req, res, next) => {
    try {
      const userId = req.session.user_id;
  
      if (userId) {
        const productsInCart = await Cart.findOne({ user_id: userId }).populate('items.product_Id');
        res.locals.productsInCart = productsInCart;
      }
  
      next();
    } catch (error) {
      next(error);
    }
  };

  module.exports= fetchCartData
  
  