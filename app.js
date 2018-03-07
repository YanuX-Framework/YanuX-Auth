var express = require('express');
var logger = require('morgan');
var cons = require('consolidate');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('connect-flash');
var mongoose = require('mongoose');
var passport = require('passport');
var path = require('path');
var favicon = require('serve-favicon');
var lessMiddleware = require('less-middleware');

var app = express();
var User = require('./models/user');
// Defining a string that will be used to encode and decode cookies.
// TODO: I should probably store the session secret somewhere safe and only load it into memory when needed.
var cookieSecret = 'efX4U4RtG1D0by7vWls6l5mYfAfpY4KKkGrWqIs1';

// Setting up the logger.
app.use(logger('dev'));

// Setting up nunjucks as the view engine for the express application using consolidate.
app.engine('njk', cons.nunjucks);
// Also set .njk as the default extension for view files.
app.set('view engine', 'njk');
app.set('views', __dirname + '/views');

// Setting up the body and cookie parser.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser(cookieSecret));
app.use(flash());

// Setting up the session 
app.use(session({
  secret: cookieSecret,
  resave: true,
  saveUninitialized: true
}));

// Setting up the database connection.
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/yanux-auth')
  .then(() => console.debug('MongoDB [SUCCESS]: Connection Succesful'))
  .catch((error) => console.error('MongoDB [ERROR]: ' + error));

// Setting up user authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Setting up automaticc LESS compilation to plain CSS
app.use(lessMiddleware(path.join(__dirname, 'public')));
// Setting up the favicon.
// uncomment after placing your favicon in /public.
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// Setting up access to some JavaScript libraries placed under node_modules.
app.use('/javascripts', express.static(__dirname + '/node_modules/jquery/dist')); // Redirect jQuery
app.use('/javascripts', express.static(__dirname + '/node_modules/popper.js/dist')); // Redirect Popper.js
app.use('/javascripts', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // Redirect Bootstrap JavaScript
// Setting up access to some CSS libraries placed under node_modules.
app.use('/stylesheets', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css'))); // Redirect Bootstrap CSS
// Setting direct access access to the public folder.
app.use(express.static(path.join(__dirname, 'public')));

// Setting up routes
var index = require('./routes/index');
var auth = require('./routes/auth');
app.use('/', index);
app.use('/auth', auth);

//Setting up error handling
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error.njk');
});

module.exports = app;
