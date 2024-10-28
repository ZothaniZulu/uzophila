const mongoose = require('mongoose');
const moment = require('moment-timezone');

let time = moment().tz("Africa/Maseru");
let current_date = time.format('YYYY-MM-DD');

//UserSchema
const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    cellphoneNumber:{
        type: String,
        required: true
    },
    province: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    emailConfirmationStatus: {
        type: String,
        default: 0,
        required: true
    },
    password: {
        type: String,
        required: true  
    },
    registeredOn: {
        type: String,
        default: current_date,
        required: true
    }
}, {timestamps: true});

const User = module.exports = mongoose.model('User', userSchema);