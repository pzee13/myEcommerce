const Admin = require("../models/adminModels/adminModel")
const User = require("../models/userModels/userModel")
const Category = require("../models/categoryModel")
const Product = require("../models/productModel")
const Coupon = require("../models/couponModel")
const Offer = require("../models/offerModel")
const bcrypt = require('bcrypt')
const path = require("path")
const Cart = require("../models/cartModel")
const Order = require("../models/orderModel")
const fs = require("fs")



const loadAddOffer = async( req, res ) => {
    try {  
    res.render('addOffer')
    } catch (error) {
        console.log(error.message)
        res.redirect('/500')

    }
}

const addOffer = async ( req, res ) => {
    try {
        const { search, page } = req.query
        const { startingDate, expiryDate, percentage } = req.body
        const name = req.body.name.toUpperCase()
        const offerExist = await Offer.findOne({ name : name })
        if( offerExist ) {
            res.render('addOffer',{message:'Offer already existing'})
        } else {
         const offer = new Offer({
            name : name,
            startingDate : startingDate, 
            expiryDate : expiryDate,
            percentage : percentage,
            search : search,
            page : page
         }) 
         await offer.save()
         res.redirect('/admin/offers')
        }
    } catch (error) {
        console.log(error.message)
        res.redirect('/500')
    }
}


const loadOffers = async( req, res ) => {
    try {
        const offers = await Offer.find()
        res.render('offers',{
            offers : offers,
            now : new Date()
        })
    } catch (error) {
        console.log(error.message)
        res.redirect('/500')

    }
}

const loadEditOffer = async ( req, res ) => {
    try {
        const id = req.params.id
        const offer = await Offer.findOne({ _id:id})
        res.render('editOffer',{
            offer : offer
        })
    } catch (error) {
        console.log(error.message)
        res.redirect('/500')

    }
}

const editOffer = async ( req, res ) => {
    try {
        const { id, name, startingDate, expiryDate, percentage } = req.body
        await Offer.updateOne({ _id : id }, {
            $set : {
                name : name.toUpperCase(),
                startingDate : startingDate,
                expiryDate : expiryDate,
                percentage : percentage
            }
        })
        res.redirect('/admin/offers')
    } catch (error) {
        console.log(error.message)
        res.redirect('/500')

    }
}

const cancelOffer = async ( req, res ) => {
    try {
        const  { offerId } = req.body
        await Offer.updateOne({ _id : offerId }, {
            $set : {
                status : false
            }
        })
        res.json({ cancelled : true})
    } catch (error) {
        res.json({cancelled: false,message:'Cant cancel some errors'})
        res.redirect('/500')

    }
}



module.exports ={
    loadAddOffer,
    addOffer,
    loadOffers,
    loadEditOffer,
    editOffer,
    cancelOffer
}