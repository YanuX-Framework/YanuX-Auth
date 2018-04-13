'use strict';

// TODO: I should probably use passport-remember-me-extended because it supports signed cookies (better security):
// https://www.npmjs.com/package/passport-remember-me-extended
const RememberMeStrategy = require('passport-remember-me').Strategy;
const RememberMeToken = require('../models/remembermetoken');

const rmstrategy = new RememberMeStrategy(
    { path: '/', httpOnly: true, maxAge: RememberMeToken.MAX_REMEMBER_ME_TOKEN_AGE },
    (rmcookie, done) => {
        let plainToken = RememberMeToken.hashToken(rmcookie.token);
        RememberMeToken.findOneAndRemove({
            token: plainToken,
            expiration_date: { $gt: new Date() }
        }).populate('user')
            .exec()
            .then(rmtoken => {
                if (rmtoken && rmtoken.user) {
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
        rmtoken.generateToken().then((plainToken) => {
            let cookie = { email: user.email, token: plainToken }
            rmtoken.save()
                .then(() => done(null, cookie))
                .catch(err => done(err));
        })
    }
);

rmstrategy.cookieOptions = rmstrategy._opts;
module.exports = rmstrategy;