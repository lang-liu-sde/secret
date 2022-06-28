//jshint esversion:6
require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");


const app = express();

// console.log(process.env.API_KEY);

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
  // cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");
// mongoose.set("useCreateIndex", true);

///////////////////////////////mongoose encryption/////////////////////////////////////
// an object created from mongoose schema class
const userSchema = new mongoose.Schema ({
  email: String,
  password: String
});

// important!!
// const secret = "Thisisourlittlesecret";

// ecrypted only certain field
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });
///////////////////////////////////////////////////////////////////////////////////////////

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// home page
app.get("/", function(req, res) {
  // use home.ejs to render the home page
  res.render("home");
});

// login page
app.get("/login", function(req, res) {
  res.render("login");
});

// register page
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

// different from the tutorial
app.get("/logout", function(req, res) {
  req.logout(function(err) {
    if (!err) {
      res.redirect("/");
    } else {
      console.log(err);
    }

  });

});


//////////////////////////////////////below is for level 4 - hashing & salting/////////////////////////
// only if user signed register page, input his email & password, will render secrets page
// app.post("/register", function(req, res) {
//   // using bcrypt
//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//
//     const newUser = new User({
//       email: req.body.username,
//       password: hash
//     });
//     // when call save, a. store to mongodb; b. encrypt password
//     newUser.save(function(err) {
//       if (err) {
//         console.log(err);
//       } else {
//         res.render("secrets");
//       }
//     });
//   });
//   //
// });
//
// // validate if the database has such a user
// app.post("/login", function(req, res) {
//   const username = req.body.username;
//   const password = req.body.password;
//   // decrypt password when call find
//   User.findOne({email: username}, function(err, foundUser) {
//     if (err) {
//       console.log(err);
//     } else {
//       if (foundUser) {
//         // using bcrypt
//         bcrypt.compare(password, foundUser.password, function(err, result) {
//           if (result === true) {
//             res.render("secrets");
//           } else {
//             console.log(err);
//           }
//         });
//           // console.log(foundUser.password);
//       }
//     }
//   });
// });
//////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////below is level 5 - cookie & session/////////////////////////
app.post("/register", function(req, res) {
  // register() method comes from the passport-local-mongoose package
  // js object with {} in it.
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.direct("/register");
    } else {
      // authenticate our user using passport
      passport.authenticate("local")(req, res, function() {
        // Here is the different point from the previous procedure
        // previous: res.render("/secrets") after register & login
        // current: we can direct to route "/secrets" after authenticating, therefore we need app.get("/secrets")
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function(req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  // this method comes from passport
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      // send cookie and tell the browser to hold on that cookie
      passport.authenticate("local")(req, res, function() {
        res.redirect("/secrets");
      });

    }
  });

});






















app.listen(3000, function() {
  console.log("The server has been started at port 3000 successfully!");
});
