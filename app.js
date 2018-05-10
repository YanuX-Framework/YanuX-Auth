'use strict';

// WiP: Add OAuth 2.0 server support. There are at least 2 main npm packages for that:
// https://tools.ietf.org/html/rfc6749
// https://tools.ietf.org/html/rfc8252
// https://www.npmjs.com/package/oauth2orize
// https://www.npmjs.com/package/oauth2-server
// https://www.npmjs.com/package/node-oauth2-server
// https://npmcompare.com/compare/node-oauth2-server,oauth2-server,oauth2orize
// https://blog.cloudboost.io/how-to-make-an-oauth-2-server-with-node-js-a6db02dc2ce7
// https://tech.zilverline.com/2017/03/17/nodejs-oauth2-provider
// https://oauth.net/code/
// http://scottksmith.com/blog/2014/07/02/beer-locker-building-a-restful-api-with-node-oauth2-server/
// https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2

// TODO: Add JSON Web Tokens to improve security
// https://jwt.io/
// https://auth0.com/learn/json-web-tokens/
// https://github.com/auth0/node-jsonwebtoken
// https://zapier.com/engineering/apikey-oauth-jwt/
// NOTE: In fact, I may also extend OAuth 2 support to JWT:
// https://tools.ietf.org/html/rfc7523
// https://github.com/xtuple/passport-oauth2-jwt-bearer
// https://github.com/xtuple/oauth2orize-jwt-bearer
// https://developers.google.com/identity/protocols/OAuth2ServiceAccount

// WiP: Refactor code so that I have proper log support:
// http://www.jyotman.xyz/post/logging-in-node.js-done-right
// https://blog.risingstack.com/node-js-logging-tutorial/
// http://tostring.it/2014/06/23/advanced-logging-with-nodejs/
// https://strongloop.com/strongblog/compare-node-js-logging-winston-bunyan/

// TODO: Add internationalization support. I'll probably use i18next + moment.js: 
// https://www.i18next.com/
// https://github.com/i18next/i18next-express-middleware
// https://www.npmjs.com/package/moment
// But Globalize also seems to be pretty decent and more complete (with number, date and currency formatting):
// https://github.com/globalizejs/globalize
// But here are some other options below:
// https://github.com/airbnb/polyglot.js
// https://www.npmjs.com/package/i18n-2
// https://github.com/mashpie/i18n-node

// TODO: Add unit testing to my code. These are just some tutorials that I should look at:
// https://alexanderpaterson.com/posts/how-to-start-unit-testing-your-express-apps
// https://scotch.io/tutorials/test-a-node-restful-api-with-mocha-and-chai
// https://glebbahmutov.com/blog/how-to-correctly-unit-test-express-server/
// These may also be interesting:
// http://mherman.org/blog/2016/09/12/testing-node-and-express/
// https://codeburst.io/unit-testing-in-express-with-promise-based-middleware-and-controllers-7d3d59ae61f8

const express = require('express');
const morgan = require('morgan');
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
const nodemailer = require('nodemailer');
const EmailTemplate = require('email-templates');
const logger = require('./logger');
const httpBasicStrategy = require('./utils/httpbasicstrategy');
const clientHttpBasicStrategy = require('./utils/clienthttpbasicstrategy');
const clientPasswordStrategy = require('./utils/clientpasswordstrategy');
const httpBearerStrategy = require('./utils/httpbearerstrategy');
const rememberMeStrategy = require('./utils/remembermestrategy');

// TODO: I should probably store the session/secret somewhere safe and only load it into memory when needed.
const secret = 'efX4U4RtG1D0by7vWls6l5mYfAfpY4KKkGrWqIs1';
const app = express();

// Setting up the logger.
app.use(morgan('dev', {
  stream: logger.stream
}));

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
  preview: false,
  transport: nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'm5563id2xqb67hyl@ethereal.email',
      pass: 'WUvwvsEg9Q3cER5pMT'
    }
  })
});

// Setting up the database connection.
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/yanux-auth')
  .then(() => {
    logger.debug('MongoDB Connection Succesful');
  }).catch((error) => {
    logger.debug(error);
    //process.exit(1);
  });

// Setting up user authentication
app.use(passport.initialize());
app.use(passport.session());

const User = require('./models/user');
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Setting up HTTP Basic Authentication
passport.use(httpBasicStrategy);

// Setting up Client's HTTP Basic Authentication
passport.use('client-basic', clientHttpBasicStrategy);

// Setting up Client's Password Authentication
passport.use(clientPasswordStrategy);

// Setting up HTTP Bearer Authentication
passport.use(httpBearerStrategy);

// Setting up Token-based Remember Me Authentication
passport.use(rememberMeStrategy);
app.use(passport.authenticate('remember-me'));

// Setting up routes
const index = require('./routes/index');
const auth = require('./routes/auth');
const oauth2 = require('./routes/oauth2');
const api = require('./routes/api');

app.use('/', index);
app.use('/auth', auth);
app.use('/oauth2', oauth2);
app.use('/api', api);

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

module.exports = app;