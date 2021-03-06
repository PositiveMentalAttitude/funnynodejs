var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var app = express();
var morgan = require('morgan');
var mongoose = require('mongoose');
var session = require('express-session');

var publicDir = require('../public/javascripts/test');

var passport = require('passport');
var flash = require('connect-flash');

//This lib gonna keep the user connecting state if the server is down and then up instantly
var MongoStore = require('connect-mongo')(session);

mongoose.connect('mongodb://127.0.0.1/test');

router.use(express.static('public'));

router.use(bodyParser.urlencoded({extended : true}));

router.use(morgan('dev'));

router.use(session({
  secret: "DORAEMON",
  saveUninitialized: true,
  resave: true,
  //This will store the session into mongodb
  //ttl is time to leave, 
  //if users do not interact with the server in ttl time, they will have to re-log in
  store: new MongoStore({ mongooseConnection : mongoose.connection , ttl: 2 * 24 * 60 * 60}),
}));

router.use(passport.initialize());

//This gonna use the session that has been set above
//It can only be called after defining session
router.use(passport.session());

router.use(flash());

require('./passport')(passport);

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('mainpage');
  console.log(req.cookies);
  console.log("============================");
  console.log(req.session);
  res.end();
});

//If not a '/', jump to here, this is used to save data to mongoDB
require('./routerjs')(router, passport);

// require('./testTokenAuth')(router,passport);

// router.post('/', function (req, res, next) {

//   console.log(req.body);

//   res.send("Message received");
// });
module.exports = router;