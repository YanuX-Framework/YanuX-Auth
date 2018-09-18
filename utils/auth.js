'use strict';

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');


const authenticateCallback = function (req, res, next) {
    return function (err, user, info) {
        if (err) {
            return next(err);
        } else if (!user) {
            let err = new Error('Unauthorized')
            err.status = 401;
            return next(err)
        } else {
            req.logIn(user, function (err) {
                if (err) { return next(err); }
                return next();
            });
        }
    }
}

// Passport Local Session-based Authentication
module.exports.ensureLoggedIn = function (req, res, next) {
    const passportBasic = function () {
        return passport.authenticate('basic', authenticateCallback(req, res, next), { session: false })(req, res, next);
    };
    const passportEnsureLoggedIn = function () {
        return connectEnsureLogin.ensureLoggedIn('/auth/login')(req, res, next)
    };
    res.format({
        'text/html': passportEnsureLoggedIn,
        'application/json': passportBasic,
        'default': passportEnsureLoggedIn
    });
}

// HTTP Authentication
module.exports.ensureHttpBasicAuth = passport.authenticate('basic', { session: false });
module.exports.ensureHttpBearerAuth = passport.authenticate('bearer', { session: false });
module.exports.ensureHttpAuthenticated = passport.authenticate(['basic', 'bearer'], { session: false });

// HTTP Client Authentication
module.exports.ensureClientHttpBasicAuth = passport.authenticate('client-basic', { session: false });

// Client Authentication
module.exports.ensureClientAuth = passport.authenticate(['client-basic', 'oauth2-client-password'], { session: false });