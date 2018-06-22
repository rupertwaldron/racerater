var express = require('express');
var router = express.Router({mergeParams: true});
var Campground = require('../models/campground');
var Comment= require('../models/comment');
var middleware  = require('../middleware');

//===========================comments routes==========================
//NEW COMMENT ROUTE
router.get("/new", middleware.isLoggedIn, (req, res) => {
    //res.send('This is the new comments page');
    Campground.findById(req.params.id, (err, campground) => {
         if(err || !campground) {
            req.flash('error', 'Error Finding Campground');
            res.redirect("/campgrounds");
        } else {
            //console.log(campground);
            res.render("comments/new", {campground: campground}); 
        }
  });
});

//CREATE COMMENT ROUTE
router.post("/", middleware.isLoggedIn, (req, res) => {
    // res.send("This is the comments page");
    Campground.findById(req.params.id, (err, campground) => {
      if (err || !campground) {
          req.flash('error', 'Error Finding Campground');
          res.redirect("/campgrounds");
        } else {
            //console.log(req.body.comment);
            Comment.create(req.body.comment, (err, comment) => {
                if(err || !comment) {
                    req.flash('error', 'Error Creating Comment');
                } else {
                    // add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    req.flash('success', ' You just created a comment in the DB');
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        } 
    });
});

//EDIT COMMENT ROUTE
router.get('/:comment_id/edit', middleware.checkCommentOwnership, (req, res) => {
    Campground.findById(req.params.id, (err, foundCampground) => {
        if(err || !foundCampground) {
            req.flash('error', 'Error Finding Campground');
            res.redirect('back');
        } else {
            Comment.findById(req.params.comment_id, (err, foundComment) => {
                if(err || !foundComment) {
                    req.flash('error', 'Error Finding Comment');
                    res.redirect('back');
                } else {
                    res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
                }
            });
        }
    });
});


//UPDATE COMMENT ROUTE
router.put('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
    console.log(req.params.comment_id + ' : ' + req.body.comment)
    // need to pass in the object not just the text (comment.text)
     Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
         if(err) {
             req.flash('error', err.message);
             res.redirect('back');
         } else {
             req.flash('success', 'You just updated the comment in the DB');
             res.redirect("/campgrounds/" + req.params.id);
         }
     });
});

// DESTROY COMMENT ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndRemove(req.params.comment_id, (err, deletedComment) => {
        if(err) {
            req.flash('error', err.message);
            res.redirect("back");
        } else {
            req.flash('success', "Comment has been deleted");
            res.redirect("/campgrounds/" + req.params.id);
        }
    })
});


module.exports = router;
