var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
    username: {type: String, unique: true, required: true},
    password: String,
    avatar: {type: String, default: 'https://res.cloudinary.com/ruppyrup/image/upload/v1530341884/avatar-1606916_960_720.png'},
    firstName: String,
    lastName: String,
    email: {type: String, unique: true, required: true},
    isAdmin: {type: Boolean, default: false}
});

userSchema.plugin(passportLocalMongoose); // adds lots of stuff to schema

module.exports = mongoose.model('User', userSchema);