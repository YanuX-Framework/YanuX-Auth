'use strict';

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');

module.exports.ensureLoggedIn = connectEnsureLogin.ensureLoggedIn('/auth/login');
module.exports.ensureAuthenticated = passport.authenticate(['basic', 'bearer'], { session: false });
module.exports.ensureHttpBasicAuth = passport.authenticate('basic', { session: false });
module.exports.ensureClientHttpBasicAuth = passport.authenticate('client-basic', { session: false });
module.exports.ensureHttpBearerAuth = passport.authenticate('bearer', { session: false });