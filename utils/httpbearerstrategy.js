'use strict';

var HttpBearerStrategy = require('passport-http-bearer').Strategy
var AccessToken = require('../models/accesstoken');

module.exports = new HttpBearerStrategy((accessToken, callback) => {
    AccessToken.findOne({ value: accessToken }).populate('user').exec()
        .then(token => {
            if (token && token.user) {
                // TODO: Implement Scopes!
                callback(null, user, { scope: '*' });
            } else {
                return callback(null, false);
            }
        }).catch(err => callback(err));
});