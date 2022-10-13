//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// livello 2
// var encrypt = require('mongoose-encryption');
// livello 3
// const md5 = require("md5");
// livello 4
// const bcrypt = require('bcrypt');
// livello 5
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
var findOrCreate = require('mongoose-findorcreate');

const app = express();

// livello 4
const saltRounds = 10;

// console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB1");

// pre mongoose encryption
// const userSchema = {
//     email: String,
//     password: String
// };

// mongoose encryption
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});
// stringa spostata nel file .env
// const secret = "Thisisourlittlesecret.";

// livello 2
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// metodo passport-local-mongoose
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);

      User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
    res.render("home");
});

// app.get("/auth/google", passport.authenticate("google",{scope: [ 'email', 'profile' ]})
// );
app.get("/auth/google",
  passport.authenticate("google", { scope:
      [ "email", "profile" ] }
));

app.get( "/auth/google/secrets",
    passport.authenticate( "google", {
        successRedirect: "/secrets",
        failureRedirect: "/login"
}));

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});


app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

app.post("/register", function(req, res) {

    User.register({
        username: req.body.username
    }, req.body.password, function(err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });
    // PRE livello 5
    // // livello 4
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //
    //     const newUser = new User({
    //         email: req.body.username,
    //         // livello 2
    //         // password: req.body.password
    //         // livello 3
    //         // password: md5(req.body.password)
    //         // livello4
    //         password: hash
    //     });
    //     newUser.save(function(err) {
    //         if (err) {
    //             console.log(err);
    //         } else {
    //             res.render("secrets");
    //         }
    //     });
    // });

});

app.post("/login", function(req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });

    // PRElivello 5
    // const username = req.body.username;
    // // livello 2
    // // const password = req.body.password;
    // // livello 3
    // // const password = md5(req.body.password);
    // // livello 4
    // const password = req.body.password;
    //
    // User.findOne({
    //     email: username
    // }, function(err, foundUser) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         if (foundUser) {
    //             // PRElivello 4
    //             // if (foundUser.password === password) {
    //             // livello 4
    //             bcrypt.compare(password, foundUser.password, function(err, result) {
    //                 if (result === true) {
    //                     res.render("secrets");
    //                 }
    //             });
    //
    //         }
    //     }
    // })
});


app.listen(3000, function() {
    console.log("server started on port 3000");
});
