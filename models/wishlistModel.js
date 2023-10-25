const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference the User model
    required: true
  },
  products:[ {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  }]
});

module.exports = mongoose.model("wishlist", wishlistSchema)