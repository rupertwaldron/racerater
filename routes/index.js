var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require('passport');


router.get("/", function(req, res) {
    res.render("landing");
});

//=========AUTH ROUTES====================

router.get('/register', (req, res) => {
    res.render('register');
})

//handling user signup
router.post('/register', (req, res) => {
    // register will hash the password and return into the User object
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email,
    });
    //eval(require('locus')); // stops at this point and checks variables
    if(req.body.adminCode === 'Ruppy_Rup') {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, (err, user) => {
        if(err) {
            req.flash('error', "Registration Failure! " + err.message);
            return res.redirect('register')
        } 
        req.flash('success', "Welcome " + user.username);
            //uses serialize from above and local as opposed to Facebook
        passport.authenticate('local')(req, res, () => {
            res.redirect('/campgrounds');
        }); 
    });
});

// LOGIN ROUTES
router.get('/login', (req, res) => {
    res.render('login');
});

//middleware sit between route and callback
//passport automatically takes password and username from the form
router.post('/login', passport.authenticate('local', {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), (req, res) => {
});

// LOGOUT ROUTES
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Logged you out!');
    res.redirect("/campgrounds");
});

//USER PROFILE ROUTE
router.get("/users/:id", (req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
        if(err) {
            req.flash('error', 'something went wrong with user');
            res.redirect("/");
        } else {
            res.render('users/show', {user: foundUser});
        }
    });
});
module.exports = router;