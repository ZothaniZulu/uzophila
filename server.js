const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { check, validationResult } = require('express-validator');
const flash = require('connect-flash');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

//Connect to database
require('./config/db');

// Init App
const app = express();

//Load view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

  // Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));

  
// parse application/json
app.use(bodyParser.json());

//Session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    name: 'uzophila2024'
    
}));

//Bring in the models
let User = require('./models/user');

//Express Messages Middleware
app.use(require('connect-flash')());
    app.use(function (req, res, next) {
        res.locals.messages = require('express-messages')(req, res);
        next();
    }
);


app.get('/', function(req, res){
    
})


// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize(console.log("Passport initialized")));
app.use(passport.session(console.log("Passport session on standby")));


/* User Access routes */

//Load login page
app.get('/login', function(req, res){
  let emailAddress = req.body.username;
  let server_url = req.protocol + '://' + req.get('host');
  res.render('users/login',{
      title: 'Login',
      emailAddress:emailAddress,
      server_url:server_url
  });
});

app.post('/login', function(req, res, next) {
  let emailAddress = req.body.username;
  let server_url = req.protocol + '://' + req.get('host');
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) {
      req.flash('danger', 'Incorrect credentials, please try again.');
      res.render('users/login',{
        emailAddress:emailAddress,
        server_url:server_url
      });

      console.log('Login failed');
    }else{
      req.logIn(user, function(err) {
        if (err) {
          console.log(err);
          return;
        }else{
          res.redirect('/');
        }
      });
    }
  })(req, res, next);
});

//Logout
app.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/login');
});

//Access Control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    res.redirect('/login');
  }
}

/* End of User Access Routes */

//Home page
app.get('/', ensureAuthenticated, function(req, res){
  User.findById(req.user._id, function(err, user){
    if(err){
      console.log(err);
    }else{
      res.render('home', {
        user: user
      }) 
    }
  });
});


// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server started on port ${PORT}`);
});

