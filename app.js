var LocalStrategy   = require("passport-local"),
    Campground      = require("./models/campground"),
    bodyParser      = require("body-parser"),
    Comment         = require("./models/comment"),
    methodOverride  = require("method-override"),
    express         = require("express"),
    passport        = require("passport"),
    mongoose        = require("mongoose"),
    request         = require("request"),
    seedDB          = require("./seed"),
    flash           = require("connect-flash"),
    User            = require("./models/user");
    
// requiring routes
var commentRoutes       = require("./routes/comments");
var campgroundRoutes    = require("./routes/campgrounds");
var indexRoutes         = require("./routes/index");


var app = express();
//need body parser to make an object from req.body
app.use(bodyParser.urlencoded({extended: true}));
// production database
mongoose.connect("mongodb://rupert:spiral8@ds131721.mlab.com:31721/racerater");
//mongoose.connect("mongodb://localhost/yelp_camp");
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");
app.use(methodOverride("_method"));
app.use(flash()); //needs to be before passport
//seedDB(); //seed the database


//PASPORT CONFIG
app.use(require('express-session') ({
    secret: "This is my secret key phrase",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// make currentUser available to all routes
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next(); //just moves on to closure
});

//will append first parameter to route
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/comments',commentRoutes);
app.use('/', indexRoutes);

app.listen(process.env.PORT, process.env.IP, function() {
    console.log("Yelp Camp Server Initiated!");
});