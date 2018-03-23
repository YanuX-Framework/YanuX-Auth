'use strict';

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');

module.exports.ensureLoggedIn = connectEnsureLogin.ensureLoggedIn('/auth/login')
module.exports.ensureHttpBasicAuth = passport.authenticate('basic', { session: false });