const isLogin = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            next();
        } else {
            res.redirect('/');
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('505-error');
    }
}

const isLogout = async (req, res, next) => {
    try {
        if (req.session.user_id) {
            res.redirect('/home');
        } else {
            next();
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).render('505-error');
    }
}

module.exports = {
    isLogin,
    isLogout
}