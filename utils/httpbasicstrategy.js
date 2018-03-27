'use strict';

const HttpBasicStrategy = require('passport-http').BasicStrategy;
const User = require('../models/user');

module.exports = new HttpBasicStrategy(
    function (email, password, done) {
        User.findOne({ email: email })
            .then(user => {
                if (user) {
                    user.authenticate(password)
                        .then((result, reason) => {
                            if (result) {
                                return done(null, user);
                            } else {
                                return done(null, false);
                            }
                        }).catch(err => done(null, false));
                } else {
                    return done(null, false);
                }
            }).catch(err => done(err))
    });