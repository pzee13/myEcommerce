 const Wishlist = require("../models/wishlistModel")

 const fetchWislistData =  async (req, res, next) => {
    try {
      const userId = req.session.user_id;
  
      if (userId) {
        const productsInWishlist = await Wishlist.findOne({ user_id: userId })
        res.locals.productsInWishlist = productsInWishlist;
      }
  
      next();
    } catch (error) {
      next(error);
    }
  };


  module.exports = fetchWislistData