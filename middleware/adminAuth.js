// const isLogin = async(req,res,next)=>{

//     try
//         {
//             if(req.session.admin_id)
//                 {
                    
//                 }
//             else
//                 {
//                     res.redirect('/admin')
//                 }
//             next()
//         }
//     catch (error)
//         {
//             console.log(error.message)
//         }
// }

// const isLogout = async(req,res,next)=>{
//     try
//         {
//             if(req.session.admin_id)
//                 {
//                     res.redirect('/admin/home')
//                 }
//             next()
//         }
//     catch (error)
//         {
//             console.log(error.message)
//         }
// }

const isLogin = async (req, res, next) => {
    try {
        if (req.session.admin_id) {
            return next(); // Proceed to the next middleware or route
        } else {
            res.redirect('/admin');
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin'); // Handle errors by redirecting
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.admin_id) {
            res.redirect('/admin/home');
        } else {
            return next(); // Proceed to the next middleware or route
        }
    } catch (error) {
        console.log(error.message);
        res.redirect('/admin/home'); // Handle errors by redirecting
    }
}


module.exports ={
    isLogin,
    isLogout
}