var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var lessMiddleware = require('less-middleware');
var cons = require('consolidate')
var mongoose = require('mongoose');
var passport = require('passport');
var logger = require('morgan');

var app = express();
// assign the swig engine to .html files
app.engine('njk', cons.nunjucks);

// set .html as the default extension
app.set('view engine', 'njk');
app.set('views', __dirname + '/views');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Setting up the database connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/yanux-auth')
  .then(() => console.debug('MongoDB <SUCCESS>: Connection Succesful'))
  .catch((error) => console.error('MongoDB <ERROR>: ' + error));

// Setting up Passport
var LocalStrategy = require('passport-local').Strategy;

app.use(session({
  // TODO: I should probably store the session secret somewhere safe and only load it into memory when needed.
  secret: 'efX4U4RtG1D0by7vWls6 l5mYfAfpY4KKkGrWqIs1',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

var User = require('./models/User');
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(lessMiddleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/javascripts', express.static(__dirname + '/node_modules/jquery/dist')); // Redirect jQuery
app.use('/javascripts', express.static(__dirname + '/node_modules/popper.js/dist')); // Redirect Popper.js
app.use('/javascripts', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // Redirect Bootstrap JavaScript
app.use('/stylesheets', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css'))); // Redirect Bootstrap CSS

var index = require('./routes/index');
var auth = require('./routes/auth');
app.use('/', index);
app.use('/auth', auth);

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
