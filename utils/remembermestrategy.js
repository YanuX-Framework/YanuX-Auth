'use strict';

// TODO: I should probably use passport-remember-me-extended because it supports signed cookies (better security):
// https://www.npmjs.com/package/passport-remember-me-extended
const RememberMeStrategy = require('passport-remember-me').Strategy;
const RememberMeToken = require('../models/remembermetoken');

const maxRememberMeTokenAge = 604800000 // 7 days

const rmstrategy = new RememberMeStrategy(
    { path: '/', httpOnly: true, maxAge: maxRememberMeTokenAge },
    (rmcookie, done) => {
        let now = new Date().getTime();
        let maxAgeDate = new Date(now - maxRememberMeTokenAge);
        let plainToken = RememberMeToken.hashToken(rmcookie.token);
        RememberMeToken.findOneAndRemove({
            token: plainToken,
            timestamp: { $gt: maxAgeDate }
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
        let rmtoken = new RememberMeToken({ user: user._id })
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