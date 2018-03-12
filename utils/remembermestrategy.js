'use strict';
// TODO: I should probably use passport-remember-me-extended because it supports signed cookies (better security):
// https://www.npmjs.com/package/passport-remember-me-extended
const RememberMeStrategy = require('passport-remember-me').Strategy;
const RememberMeToken = require('../models/remembermetoken');
const crypto = require('crypto');

const maxAge = 604800000 // 7 days

const rmstrategy = new RememberMeStrategy(
    { path: '/', httpOnly: true, maxAge: maxAge },
    function (rmcookie, done) {
        RememberMeToken.findOneAndRemove({
            token: crypto.createHash('sha256')
                .update(rmcookie)
                .digest('hex'),
            timestamp: { $gt: new Date(new Date().getTime() - maxAge) }
        })
            .populate('user')
            .exec(function (err, rmtoken) {
                if (err) {
                    return done(err);
                }
                if (!rmtoken || !rmtoken.user) {
                    return done(null, false);
                }
                return done(null, rmtoken.user)
            });
    },
    function (user, done) {
        let rmtoken = new RememberMeToken({ user: user._id })
        rmtoken.generateToken(function (plainToken) {
            rmtoken.save(function (err) {
                if (err) {
                    return done(err);
                }
                return done(null, plainToken);
            })
        })
    }
);

rmstrategy.cookieOptions = rmstrategy._opts;

module.exports = rmstrategy;