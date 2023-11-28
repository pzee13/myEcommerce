const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
                firstName:{
                    type:String,
                    required:true
                },
                lastName:{
                    type:String,
                    required:true
                },
                email:{
                    type:String,
                    required:true
                },
                mobile:{
                    type:String,
                    required:true
                },
                password:{
                    type:String,
                    required:true
                },
                isVerified: {
                    type: Boolean,
                    default: 0
                },
                isBlock:{
                    type: Boolean,
                    default: false
                },
                token:{
                    type:String,
                    default:''
                },
                referralCode: {
                  type: String,
                  unique: true,
              },
                wallet : {
                    type : Number,
                    default : 0
                },
                walletHistory: [
                    {
                      date: {
                        type: Date,
                        required:true
                      },
                      amount: {
                        type: Number,
                        required:true
                      },
                      description: {
                        type: String,
                        required:true
                      },
                      transactionType:{
                        type:String
                      },
                    },
                  ]
            },
            {
              timestamps:true
            })

module.exports = mongoose.model('User',userSchema)