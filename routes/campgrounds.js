var express = require('express');
var router = express.Router();
var Campground = require('../models/campground');
var middleware = require('../middleware'); //will automatically grap the index.js file
var moment = require('moment');
var Comment= require('../models/comment');
var User = require('../models/user');
var multer = require('multer');
var cloudinary = require('cloudinary');
var NodeGeocoder = require('node-geocoder');

var options = {
    provider: 'google',
    httpAdapter: 'https',
    api_key: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = NodeGeocoder(options);

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

//campgrounds - Displays all the campsites
router.get("/", (req, res) => {
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
         Campground.find({"name": regex}, (err, foundCampgrounds) => {
            if(err) {
                req.flash('error', err.message);
            } else {
                res.render("campgrounds/index", {
                    campgrounds: foundCampgrounds
                });
            }
         });
    } else {
        //Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
        //Campground.find({}, (err, AllCampgrounds) => {
        Campground.find().populate("comments").exec((err, AllCampgrounds) => {
            if(err) {
                req.flash('error', err.message);
            } else {
                res.render("campgrounds/index", {
                    campgrounds: AllCampgrounds
                });
            }
        });
    }
});

//NEW - Displays a form for a new campsite
router.get("/new", middleware.isLoggedIn, (req, res) => {
   res.render("campgrounds/new"); 
});

//CREATE - Adds a new campsite to the database
router.post("/", middleware.isLoggedIn, upload.single('image'), (req, res) => {
    cloudinary.uploader.upload(req.file.path, (result) => {
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;
        // add author to campground
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        }
        geocoder.geocode(req.body.campground.location, (err, data) => {
            if (err || !data.length) {
                req.flash('error', 'Invalide adddress');
                return res.redirect('back');
            }
            req.body.campground.lat = data[0].latitude;
            req.body.campground.long = data[0].longitude;
            req.body.campground.location = data[0].formattedAddress;
        });
        //eval(require('locus'));
        Campground.create(req.body.campground, (err, campground) => {
            if(err) {
                req.flash('error', err.message);
                res.redirect('back');
            } else {
                req.flash('success', 'We just saved ' + campground.name + ' to the DB');
                res.redirect("/campgrounds/" + campground.id); 
            }
        });
    });
});

//SHOW - Shows more info about one campground
router.get("/:id", (req, res) => {
   Campground.findById(req.params.id).populate("comments").exec((err, foundCampground) => {
// populate gives the info on the comment  when campground contains another schema such as comment
       if(err || !foundCampground) {
            req.flash('error', 'Problem finding campground');
            res.redirect('back');
        } else {
            res.render("campgrounds/show", {campground: foundCampground, moment: moment}); 
        }
   });
});

//EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findById(req.params.id, (err, campground) => {
        if(err) {
            req.flash('error', err.message);
        } else {
            res.render("campgrounds/edit", {campground: campground});
        }
    });
});

//UPDATE CAMPGROUND ROUTE

router.put("/:id",middleware.checkCampgroundOwnership, (req, res) => {
    // find and update the correct campground
    //eval(require('locus'));
     geocoder.geocode(req.body.campground.location, (err, data) => {
        if (err || !data.length) {
            req.flash('error', 'Invalid adddress');
            return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.long = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampground) => {
           if(err){
               req.flash('error', err.message);
               res.redirect("/campgrounds");
           } else {
               //redirect somewhere(show page)
               req.flash('success', 'We just updated ' + updatedCampground.name + ' in the DB');
               res.redirect("/campgrounds/" + req.params.id);
           }
        });
    });
});

//EDIT CAMPGROUND IMAGE ROUTE
router.get("/:id/image", middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findById(req.params.id, (err, campground) => {
        if(err) {
            req.flash('error', err.message);
        } else {
            res.render("campgrounds/editImage", {campground: campground});
        }
    });
});

//UPDATE CAMPGROUND IMAGE ROUTE
router.put("/:id/image", middleware.checkCampgroundOwnership, upload.single('image'), (req, res) => {
     cloudinary.uploader.upload(req.file.path, (result) => {
        // add cloudinary url for the image to the campground object under image property
        // add author to campground
        var newCampground = {
            image: result.secure_url
        }

        Campground.findByIdAndUpdate(req.params.id, newCampground, (err, campground) => {
            if(err) {
                req.flash('error', err.message);
                res.redirect("/campgrounds");
            } else {
                req.flash('success', 'We just updated ' + campground.name + ' in the DB');
                res.redirect("/campgrounds/"+ campground.id); 
            }
        });
     });
});
    
//EDIT CAMPGROUND OWNER ROUTE
router.get("/:id/owner", middleware.checkSysAdmin, (req, res) => {
    Campground.findById(req.params.id, (err, campground) => {
    //Campground.findById(req.params.id).populate("author").exec((err, foundCampground) => {
        if(err) {
            req.flash('error', err.message);
        } else {
            //res.send("This is the update owner route");
            res.render("campgrounds/updateOwner", {campground: campground});
        }
    });
});

//UPDATE CAMPGROUND OWNER ROUTE

router.put("/:id/owner", middleware.checkSysAdmin, (req, res) => {
    // find and update the correct campground
    //eval(require('locus'));
    Campground.findById(req.params.id, (err, foundCampground) => {
        if(err || !foundCampground){
              req.flash('error', "can't find campground");
              res.redirect("/campgrounds");
        } else {
            User.findOne({username: req.body.username}, (err, foundUser) => {
                if(err || !foundUser){
                    req.flash('error', "Couldn't find user: " + req.body.username);
                    res.redirect("/campgrounds");
                } else {
                    foundCampground.author = {
                        id: foundUser._id,
                        username: foundUser.username
                    }
                    //eval(require('locus'));
                    Campground.findByIdAndUpdate(req.params.id, foundCampground, (err, updatedCampground) => {
                        if (err || !updatedCampground) {
                            req.flash('error', "Error updating campground");
                            res.redirect("/campgrounds");
                        } else {
                            req.flash('success', 'We just updated the owner of ' + updatedCampground.name+ ' with ' + foundUser.username);
                            res.redirect("/campgrounds/" + req.params.id);
                        } 
                    });
                }
            });
        }
    })
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findByIdAndRemove(req.params.id, (err, campground) => {
        if(err) {
            req.flash('error', "Failed to Delete Campground");
            res.redirect("/campgrounds");
        } else {
            req.flash('success', "Campground " + campground.name + " has been deleted!");
            res.redirect("/campgrounds");
        }
    })
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;