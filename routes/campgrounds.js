var express = require('express');
var router = express.Router();
var Campground = require('../models/campground');
var middleware = require('../middleware'); //will automatically grap the index.js file
var moment = require('moment');


//campgrounds - Displays all the campsites
router.get("/", (req, res) => {
    Campground.find({}, (err, AllCampgrounds) => {
        if(err) {
            req.flash('error', err.message);
        } else {
            res.render("campgrounds/index", {
                campgrounds: AllCampgrounds
            });
        }
    });
//   res.render("campgrounds", {campgrounds: campgrounds}); 
});

//NEW - Displays a form for a new campsite
router.get("/new", middleware.isLoggedIn, (req, res) => {
   res.render("campgrounds/new"); 
});

//CREATE - Adds a new campsite to the database
router.post("/", middleware.isLoggedIn, (req, res) => {
    //res.send("You hit the post route!");
    console.log(req.body.newCampName);
    console.log(req.body.newCampImageUrl);
    console.log(req.user); // logged in user
    var newCamp = {
        name: req.body.newCampName,
        image: req.body.newCampImageUrl,
        price: req.body.newCampPrice,
        lat: req.body.newlat,
        long: req.body.newlong,
        description: req.body.newdescription,
        author: {
            id: req.user._id,
            username: req.user.username
        }
    };
    
    Campground.create(newCamp, (err, campground) => {
        if(err) {
            req.flash('error', err.message);
        } else {
            req.flash('success', 'We just saved ' + campground.name + ' to the DB');
            res.redirect("/campgrounds"); 
        }
    });
    // campgrounds.push(newCamp);
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

router.put("/:id", middleware.checkCampgroundOwnership, (req, res) => {
    console.log("From the put: " + req.body.campground);
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, campground) => {
        if(err) {
            req.flash('error', err.message);
            res.redirect("/campgrounds");
        } else {
            req.flash('success', 'We just updated ' + campground.name + ' in the DB');
            res.redirect("/campgrounds/"+ req.params.id); 
        }
    });
    // campgrounds.push(newCamp);
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
    
module.exports = router;