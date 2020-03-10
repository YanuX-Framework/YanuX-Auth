'use strict';

// TODO: I should probably use passport-remember-me-extended because it supports signed cookies (better security):
// https://www.npmjs.com/package/passport-remember-me-extended
const RememberMeStrategy = require('passport-remember-me').Strategy;
const RememberMeToken = require('../models/remembermetoken');

const rmStrategy = new RememberMeStrategy(
    { path: '/', httpOnly: true, maxAge: RememberMeToken.MAX_REMEMBER_ME_TOKEN_AGE },
    (rmcookie, done) => {
        let hashedToken = RememberMeToken.hashToken(rmcookie.token);
        RememberMeToken.findOneAndDelete({
            token: hashedToken,
            expirationDate: { $gt: new Date() }
        }).populate('user')
            .exec()
            .then(rmtoken => {
                if (rmtoken && rmtoken.user
                    && rmtoken.user.email === rmcookie.email) {
                    return done(null, rmtoken.user);
                } else {
                    return done(null, false);
                }
            }).catch(err => done(err));
    },
    (user, done) => {
        let rmtoken = new RememberMeToken({
            user: user._id,
        })
        let plainToken = rmtoken.generateToken()
        let cookie = { email: user.email, token: plainToken }
        rmtoken.save()
            .then(() => done(null, cookie))
            .catch(err => done(err))
    }
);

rmStrategy.cookieOptions = rmStrategy._opts;
module.exports = rmStrategy;