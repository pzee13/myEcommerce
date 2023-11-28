const User = require("../models/userModels/userModel");


const fetchUserData = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        if (userId) {
            const userData = await User.findById(userId);
            res.locals.userData = userData;  // Set user data to res.locals.userData
        } else {
            res.locals.userData = null;  // Set null when there is no user
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = fetchUserData;

