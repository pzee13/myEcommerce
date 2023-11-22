const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // Reference the User model
  },
  reciever_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin"
  },
  message:{
    type:String,
    required:true
  }
},{timestamps:true}
);

module.exports = mongoose.model("chat", chatSchema)