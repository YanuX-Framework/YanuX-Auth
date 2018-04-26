'use strict';

var HttpBearerStrategy = require('passport-http-bearer').Strategy
var AccessToken = require('../models/accesstoken');

module.exports = new HttpBearerStrategy((accessToken, callback) => {
    AccessToken.findOne({ token: accessToken }).populate('user').exec()
        .then(token => {
            if (token && token.user) {
                // TODO: Implement Scopes!
                callback(null, token.user, { scope: '*' });
            } else {
                return callback(null, false);
            }
        }).catch(err => callback(err));
});