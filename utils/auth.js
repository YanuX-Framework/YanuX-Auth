'use strict';

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');

module.exports.ensureLoggedIn = connectEnsureLogin.ensureLoggedIn('/auth/login');
module.exports.ensureHttpBasicAuth = passport.authenticate('basic', { session: false });
module.exports.ensureHttpBearerAuth = passport.authenticate('bearer', { session: false });
module.exports.ensureClientHttpBasicAuth = passport.authenticate('client-basic', { session: false });

module.exports.ensureAuthenticated = [
    connectEnsureLogin.ensureLoggedIn('/auth/login'),
    /*function(req, res, next) {
        if(req.isAuthenticated()) {
            next();
        } else {
            passport.authenticate(['basic', 'bearer'], { session: false })
        }
    }*/
];