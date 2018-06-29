var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require('passport');
var middleware = require('../middleware');
var multer = require('multer');
var cloudinary = require('cloudinary');



var storage = multer.diskStorage({
    filename: (req, file, callback) => {
        callback(null, Date.now() + file.originalname);
    }
});

var imageFilter = (req, file, cb) => {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({storage: storage, fileFilter: imageFilter});

cloudinary.config({
    cloud_name: 'ruppyrup',
    api_key: process.env.CLOUDINARY_API_KEY,

    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

//SHOW USER PROFILE ROUTE
router.get("/users/:id", (req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
        //eval(require('locus'));
        if(err|| !foundUser) {
            req.flash('error', "Can't find user");
            res.redirect("/");
        } else {
            res.render('users/show', {user: foundUser});
        }
    });
});


//EDIT USER PROFILE ROUTE
router.get("/users/:id/edit", middleware.checkUserOwnership, (req, res) => {
    // Check which user is logged in
    // Update user
    // Render the show user page
    User.findById(req.params.id, (err, foundUser) => {
        if(err || !foundUser) {
            req.flash('error', "Can't find user");
            res.redirect("/");
        } else {
            res.render('users/edit', {user: foundUser});
        }
    });
    //res.send('This is the edit user route')
});


//UPDATE USER ROUTE

router.put("/users/:id", middleware.checkUserOwnership, upload.single('image'), (req, res) => {
    cloudinary.uploader.upload(req.file.path, (result) => {
        // add cloudinary url for the image to the campground object under image property
        req.body.user.avatar = result.secure_url;
        //eval(require('locus'))
    
        User.findByIdAndUpdate(req.params.id, req.body.user, (err, updatedUser) => {
            if(err || !updatedUser) {
                req.flash('error', "Can't find user");
                res.redirect("/users" + req.params.id);
            } else {
                req.flash('success', 'We just updated ' + updatedUser.username + ' in the DB');
                res.redirect("/users/" + req.params.id); 
            }
        });
    });
});



module.exports = router;