var Campground = require('../models/campground');
var Comment = require('../models/comment');
var User = require('../models/user');

//all middleware goes here
var middlewareObj = {};





middlewareObj.checkCampgroundOwnership = function(req, res, next) {
   if(req.isAuthenticated()) { // check if user is logged in
        Campground.findById(req.params.id, (err, campground) => {
            // need !campground else if is null will crash the app
             if(err || !campground) {
                req.flash('error', 'Campground Access Failure');
                res.redirect('back');
            } else {
                // need to use .equals as one is string an the other an object
                console.log(campground.author);
                console.log(req.user);
                // let author and user 'rup' edit and delete
                if(campground.author.id.equals(req.user._id) || req.user.isAdmin) {
                    req.flash('success', "Authorization Accepted!");
                    next(); //next means it will go onto the callback
                } else {
                    req.flash('error', "Authorization Denied! ");
                    res.redirect('back');
                }
            }
        });
    } else {
        req.flash('error', "Authorization Denied! ");
        res.redirect('back'); //takes user back to previous page
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
   if(req.isAuthenticated()) { // check if user is logged in
        Comment.findById(req.params.comment_id, (err, comment) => {
             if(err || !comment) {
                req.flash('error', 'Comment error');
                res.redirect('back');
            } else {
                // need to use .equals as one is string an the other an object
                console.log(comment.author);
                console.log(req.user);
                // let author and user 'rup' edit and delete
                if(comment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    req.flash('success', "Authorization Accepted! ");
                    next(); //next means it will go onto the callback
                } else {
                    res.redirect('back');
                }
            }
        });
    } else {
        req.flash('error', "Authorization Denied! ");
        res.redirect('back'); //takes user back to previous page
    }
}

middlewareObj.checkUserOwnership = function(req, res, next) {
    if(req.isAuthenticated()) { // check if user is logged in
        User.findById(req.params.id, (err, user) => {
            //eval(require('locus'));
             if(err || !user) {
                req.flash('error', 'User error');
                res.redirect('back');
            } else {
                // need to use .equals as one is string an the other an object
                console.log(user.id);
                console.log(req.user);
                // let author and user 'rup' edit and delete
                if((user.id == req.user._id) || req.user.isAdmin) {
                    req.flash('success', "Authorization Accepted! ");
                    next(); //next means it will go onto the callback
                } else {
                    res.redirect('back');
                }
            }
        });
    } else {
        req.flash('error', "Authorization Denied! ");
        res.redirect('back'); //takes user back to previous page
    }
}

middlewareObj.isLoggedIn = function(req, res, next) {
    console.log('Is logged in called');
    if(req.isAuthenticated()) {
        req.flash('success', "Authorization Accepted! ");
        return next(); //next refers to the callback in the route function
    }
    req.flash('error', "Authorization Denied - Login Required! ");
    res.redirect('/login');
}

module.exports = middlewareObj;