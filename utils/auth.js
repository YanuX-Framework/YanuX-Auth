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
module.exports.ensureHttpBasicAuth = passport.authenticate('basic', { session: false, failWithError: true });
module.exports.ensureHttpBearerAuth = passport.authenticate('bearer', { session: false, failWithError: true });
module.exports.ensureHttpAuthenticated = passport.authenticate(['basic', 'bearer'], { session: false, failWithError: true });
module.exports.ensureResourceServerHttpBasicAuth = passport.authenticate('oauth2-resource-server-http-basic-strategy', { session: false, failWithError: true });

// HTTP Client Authentication
module.exports.ensureClientHttpBasicAuth = passport.authenticate('client-basic', { session: false, failWithError: true });

// Client Authentication
module.exports.ensureClientAuth = passport.authenticate(['client-basic', 'oauth2-client-password', 'oauth2-client-pkce', 'oauth2-refresh-token'], { session: false, failWithError: true });