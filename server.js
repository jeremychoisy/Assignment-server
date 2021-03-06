const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const mongoDBConfig = require('./config/db').mongoDBConfig;
const passport = require('passport');
const morgan = require('morgan');
const AWS = require('aws-sdk');

AWS.config.update({region: process.env.AWS_REGION});
global.S3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    apiVersion: '2006-03-01'
})

// Bootstrap models
require('./app/Assignment/model');
require('./app/User/model');
require('./app/Subject/model');

require('./passport-auth');

const server = express();
const port = process.env.PORT || 80;

server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());
server.use(morgan('dev'));
server.use(passport.initialize({}));


server.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PUT, DELETE, PATCH');
    next();
});

mongoose.Promise = global.Promise;
mongoose.connect(mongoDBConfig.url, {
 useNewUrlParser: true,
 useUnifiedTopology: true,
 useFindAndModify: false
}).then(() => {
 console.log('Connection to database established!');
}).catch(err => {
 console.log(err);
 console.log('Connection to database failed :' + err);
 process.exit();
});
 
require('./app') (server);

server.use((req,res)=> {
    res.sendStatus(404);
});

server.listen(port, () => {
    console.log('Server is running and listening on port ' + port);
});
