var express = require('express');
var router = express.Router();
var User = require('../models/user');
var passport = require('passport');
var middleware = require('../middleware');
var multer = require('multer');
var cloudinary = require('cloudinary');
var Recaptcha = require('express-recaptcha').Recaptcha;
var bodyParser = require("body-parser");

var recaptcha = new Recaptcha(process.env.CAPTCHA_SITE_KEY, process.env.CAPTCHA_SECRET);

router.use(bodyParser.json({extended: true}));
router.use(bodyParser.urlencoded({extended: true}));

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
     recaptcha.verify(req, (err, data) => {
        if (err) {
            req.flash('error', "Robot Failure " + err.message);
            return res.redirect('register')
        }
    // register will hash the password and return into the User object
        var newUser = new User({
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            //avatar: 'https://cdn.pixabay.com/photo/2016/08/20/05/38/avatar-1606916_960_720.png',
            email: req.body.email,
        });
        //eval(require('locus')); // stops at this point and checks variables
        if(req.body.adminCode === process.env.SYSADMIN) {
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

router.put("/users/:id", middleware.checkUserOwnership, (req, res) => {
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

//EDIT USER IMAGE ROUTE
router.get("/users/:id/image", middleware.checkUserOwnership, (req, res) => {
    // Check which user is logged in
    // Update user
    // Render the show user page
    User.findById(req.params.id, (err, foundUser) => {
        if(err || !foundUser) {
            req.flash('error', "Can't find user");
            res.redirect("/");
        } else {
            res.render('users/editUserImage', {user: foundUser});
        }
    });
    //res.send('This is the edit user route')
});

//UPDATE USER IMAGE ROUTE

router.put("/users/:id/image", middleware.checkUserOwnership, upload.single('image'), (req, res) => {
    cloudinary.uploader.upload(req.file.path, (result) => {
        // add cloudinary url for the image to the campground object under image property
        //eval(require('locus'))
        
        var newUser = {
            avatar: result.secure_url
        }
        
        
        User.findByIdAndUpdate(req.params.id, newUser, (err, updatedUser) => {
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