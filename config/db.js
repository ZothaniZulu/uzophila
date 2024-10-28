const mongoose = require('mongoose');
//require("dotenv").config();

//Connect to database
const mongoURI ='mongodb+srv://zothanizulu38:2580456@cluster0.rplkj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
    .then(() => { console.log("Connected to database successfully") })
    .catch((err) => { console.log("Received an Error") })