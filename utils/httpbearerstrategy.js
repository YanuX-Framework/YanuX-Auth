'use strict';

var HttpBearerStrategy = require('passport-http-bearer').Strategy
var AccessToken = require('../models/accesstoken');

module.exports = new HttpBearerStrategy((accessToken, callback) => {
    AccessToken.findOne({
        token: AccessToken.hashToken(accessToken),
        expirationDate: { $gt: new Date() }
    }).populate('user')
        .populate('client')
        .exec()
        .then(token => {
            if (token && token.user && token.client) {
                // TODO: Properly Implement Scopes and other "advanced" details!
                callback(null, token.user, {
                    user: {
                        email: token.user.email
                    }, client: {
                        name: token.client.name,
                        id: token.client.id
                    }, access_token: {
                        expiration_date: token.expirationDate,
                        scope: token.scope
                    }
                });
            } else {
                return callback(null, false);
            }
        }).catch(err => callback(err));
});