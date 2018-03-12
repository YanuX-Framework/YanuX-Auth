// TODO: I should probably use passport-remember-me-extended because it supports signed cookies (better security):
// https://www.npmjs.com/package/passport-remember-me-extended
var RememberMeStrategy = require('passport-remember-me').Strategy;
var RememberMeToken = require('../models/remembermetoken');
var crypto = require('crypto');

module.exports = new RememberMeStrategy(
    { path: '/', httpOnly: true, maxAge: 604800000 },
    function (rmcookie, done) {
        RememberMeToken.findOneAndRemove({
            token: crypto.createHash('sha256')
                .update(rmcookie)
                .digest('hex'),
            timestamp: { $gt: new Date(new Date().getTime() - 604800000) }
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