'use strict';
//TODO: Add internationalization support. I'll probably use i18next + moment.js: 
// https://www.i18next.com/
// https://github.com/i18next/i18next-express-middleware
// https://www.npmjs.com/package/moment
// But Globalize also seems to be pretty decent and more complete (with number, date and currency formatting):
// https://github.com/globalizejs/globalize
// But here are some other options below:
// https://github.com/airbnb/polyglot.js
// https://www.npmjs.com/package/i18n-2
// https://github.com/mashpie/i18n-node

const express = require('express');
const logger = require('morgan');
const cons = require('consolidate');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const favicon = require('serve-favicon');
const lessMiddleware = require('less-middleware');
const mongoose = require('mongoose');
const passport = require('passport');
const rememberMeStrategy = require('./utils/remembermestrategy');
const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates');

// TODO: I should probably store the session/secret somewhere safe and only load it into memory when needed.
const secret = 'efX4U4RtG1D0by7vWls6l5mYfAfpY4KKkGrWqIs1';
const app = express();

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

// Defining a string that will be used to encode and decode cookies.
app.use(cookieParser(secret));
app.use(flash());
// Setting up the session 
app.use(session({
  secret: secret,
  resave: true,
  saveUninitialized: true
}));

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

// Setting up the database connection.
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/yanux-auth')
  .then(() => console.debug('MongoDB [SUCCESS]: Connection Succesful'))
  .catch((error) => console.error('MongoDB [ERROR]: ' + error));

// Setting up user authentication
app.use(passport.initialize());
app.use(passport.session());

const User = require('./models/user');
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Setting up Token-based Remember Me Authentication
passport.use(rememberMeStrategy);
app.use(passport.authenticate('remember-me'));

// Setting up routes
const index = require('./routes/index');
const auth = require('./routes/auth');
app.use('/', index);
app.use('/auth', auth);

//Setting up error handling
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  let err = new Error('Not Found');
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

app.locals.email = new EmailTemplate({
  views: {
    root: path.join(__dirname, 'emails'),
    options: {
      extension: 'njk',
      map: {
        'njk': 'nunjucks'
      },
    }
  },
  message: {
    from: 'm5563id2xqb67hyl@ethereal.email'
  },
  send: true,
  transport: nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'm5563id2xqb67hyl@ethereal.email',
      pass: 'WUvwvsEg9Q3cER5pMT'
    }
  })
});

module.exports = app;
