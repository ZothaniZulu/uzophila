const express = require('express');
const router = express.Router();
const { body, check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const passport = require('passport');

//Users Model
let User = require('../models/user');
let Citie = require('../models/city');

// Access Control to check if the user is signed in before accessing the routes in this file.
function ensureAuthenticated(req, res, next){
    if(req.isAuthenticated()){
      return next();
    } else {
      req.flash('danger', 'Please login');
      res.redirect('/login');
    }
}

//Get the registration page
router.get('/register', function(req, res){
    let errors = '';
    let name = req.body.name;
    let surname = req.body.surname;
    let username = req.body.username;
    let cellphoneNumber = req.body.cellphoneNumber;
    let server_url = req.protocol + '://' + req.get('host');
    res.render('users/register',{
        title: 'Register',
        errors:errors,
        name:name,
        surname:surname,
        username:username,
        cellphoneNumber:cellphoneNumber,
        server_url:server_url
    });
});

//Auto complete city when the errand creator is registering
router.post('/autocomplete', function(req, res){
    Citie.find({city:{$regex:req.body.auto, $options: "i" }},(err,autoData)=>{
        if(err){
            console.log(err);
        }else{
            res.json({data:autoData});
        }
    });
})

//Submit the errand creators registration
router.post('/register', [
    check('name', 'The name entered is too short').isLength({min:2}),
    check('surname', 'The surname entered is too short').isLength({min:2}),
    check('username', 'Please enter a valid email address').isEmail(),
    check('province', 'Please select a province').isLength({min:1}),
    check('city', 'Please select a city').isLength({min:2}),
    check('day', 'Please select the day of birth').isLength({min:1}),
    check('month', 'Please select the month of birth').isLength({min:1}),
    check('year', 'Please select the year of birth').isLength({min:1}),
    check('gender', 'Please specify your gender').isLength({min:2})
], async (req, res, next) =>{
    let server_url = req.protocol + '://' + req.get('host');

    //check if the passwords match and return a validation error if they do not match.
    if(req.body.password){
        await body('password2').equals(req.body.password).withMessage('Passwords do not match').run(req);
    }
    let name = req.body.name;
    let surname = req.body.surname;
    let username = req.body.username;
    let cellphoneNumber = req.body.cellphoneNumber;

    //Check for validation errors if there are any
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.render('users/register',{
            title: 'Register',
            name:name,
            surname:surname,
            username:username,
            cellphoneNumber:cellphoneNumber,
            server_url:server_url,
            errors:errors.mapped()
        });
    }else{
        //If there are no errors, save the new user to the database.

        let user = new User();
        user.name = req.body.name;
        user.surname = req.body.surname;
        user.username = req.body.username;
        user.cellphoneNumber = req.body.cellphoneNumber;
        user.province = req.body.province;
        user.city = req.body.city;
        //Declare the date of birth variables
        let day = req.body.day;
        let month = req.body.month;
        let year = req.body.year;
        let date_of_birth = `${day}-${month}-${year}`;
        
        //Continue with the form
        user.dateOfBirth = date_of_birth;
        user.gender = req.body.gender;
        user.password = req.body.password;

        //hash the password
        const saltRounds = 10;
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(user.password, salt, function(err, hash) {
                if(err){
                    console.log(err);
                    return;
                }else{
                user.password = hash; 
    
                user.save(function(err){
                    if(err){
                        console.log(err);
                        return;
                    }else{
                        console.log('User registered successfully');
        
                        //Send message to user
                        req.flash('info', 'Registration Completed Successfully, please login');
                        res.redirect('/login');
                    }
                });
                } 
            });
        });
    }
});

//Get city names for city input across the application when needed
router.get('/city/:province_name', function(req, res){
    Citie.find({admin_name:req.params.province_name}, function(err, cities){
        if(err){
            console.log(err);
        }else{
            const unique = [...new Set(cities.map(item => item.city))];
            res.send(unique);
        }
    });
});


//Get chatbot page
router.get('/chat_bot', function(req, res){
    User.findById(req.user._id, function(err, user){
        if(err){
            console.log(err);
        }else{
            res.render('notifications/chatbot', {
                user: user
            });
        }
    });
});

//Get page for forgot password
router.get('/forgot_password', function(req, res){
    let server_url = req.protocol + '://' + req.get('host');
    let errors = '';
    res.render('users/forgot_password', {
        errors:errors,
        server_url: server_url
    })
});

//Submit email address
router.post('/forgot_password', [
    check('emailAddress', 'Please enter a valid email address').isEmail(),
], function(req, res){
    let server_url = req.protocol + '://' + req.get('host');
    User.findOne({username: req.body.emailAddress}, function(err, user){
        if(err){
            console.log(err)
            return;
        }else{
            if(user){
                //Check for validation errors if there are any
                const errors = validationResult(req);
                if(!errors.isEmpty()){
                    res.render('users/forgot_password', {
                        errors:errors.mapped(),
                        server_url: server_url
                    });
                }else{
                    //Initialize the email gateway
                    let transporter = nodemailer.createTransport({
                        host: 'smtp.office365.com',
                        auth: {
                            user: 'errandshub@outlook.com',
                            pass: '2580456@errand'
                        }
                    });

                    let mailOptions = {
                        from: 'errandshub@outlook.com',
                        to: req.body.emailAddress,
                        subject: 'Password Reset',
                        html: `Hey there! We heard you lost your password. Sorry about that, please click on this <a href='${server_url}/users/reset_password/${user._id}'>link</a> to reset it`
                    }

                    transporter.sendMail(mailOptions, function(error, info){
                        if(error){
                            return console.log(error)
                        }else{
                            console.log('Message sent:' +info.response)
                        }
                    });
                    res.redirect('/users/password_link_sent');
                }
            }else{
                req.flash('danger', 'The email address you submitted was not found on our database.');
                res.redirect('/users/forgot_password')
            }
        }
    });
    
});

//Reset link sent successfully
router.get('/password_link_sent', function(req, res){
    res.render('users/email_sent');
});

//Get reset password page
router.get('/reset_password/:id', function(req, res){
    let server_url = req.protocol + '://' + req.get('host');
    let errors = '';
    User.findOne({_id:req.params.id}, function(err, user){
        if(err){
            console.log(err);
        }else{
            res.render('users/reset_password', {
                server_url: server_url,
                errors:errors,
                user:user
            })
        }
    });
});

//Submit new password
router.post('/reset_password/:id', async (req, res, next) =>{
    let server_url = req.protocol + '://' + req.get('host');

    if(req.body.password){
        await body('password2').equals(req.body.password).withMessage('Passwords do not match').run(req);
    }
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        User.findOne({_id:req.params.id}, function(err, user){
            if(err){
                console.log(err);
            }else{
                res.render('users/reset_password', {
                    server_url: server_url,
                    errors:errors.mapped(),
                    user:user
                })
            }
        });
    }else{
        //hash the password
        const saltRounds = 10;
        bcrypt.genSalt(saltRounds, function(err, salt) {
            bcrypt.hash(req.body.password, salt, function(err, hash) {
                if(err){
                    console.log(err);
                    return;
                }else{
                    req.body.password = hash;
                    User.updateOne({_id:req.params.id}, {password: hash}, function(err){
                        if(err){
                            console.log(err);
                            return;
                        }else{
                            req.flash('info', 'Password changed successfully, you can now log in');
                            res.redirect('/login');
                        }
                    });
                } 
            });
        });
    }
});

module.exports = router;