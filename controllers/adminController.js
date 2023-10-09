const Admin = require("../models/adminModels/adminModel")

const loadadlogin = async(req,res)=>{

    try{
        res.render('adlogin')
    }
    catch(error){
        console.log(error.message)
    }
}

module.exports = {
    loadadlogin
}