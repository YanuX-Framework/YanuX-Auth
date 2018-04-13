'use strict';

const oauth2orize = require('oauth2orize');
const uid = require('uid2');
const User = require('../models/user');
const Client = require('../models/client');
const AccessToken = require('../models/accesstoken');
const AuthorizationCode = require('../models/authorizationcode');
const InvalidAuthorizationCodeError = require('../errors/invalidauthorizationcodeerror');

const oauth2_server = oauth2orize.createServer();

oauth2_server.serializeClient(function (client, callback) {
    return callback(null, client._id);
});

oauth2_server.deserializeClient(function (id, callback) {
    Client.findById(id)
        .then(client => callback(null, client))
        .catch(err => callback(err))
});

oauth2_server.grant(oauth2orize.grant.code(function (client, redirectUri, user, ares, callback) {
    new AuthorizationCode({
        client: client._id,
        user: user._id,
        value: uid(16),
        redirectUri: redirectUri
    }).save()
        .then(code => callback(null, code.value))
        .catch(err => callback(err))
}));

oauth2_server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, callback) {
    AuthorizationCode.findOne({ value: code })
        .then(authorizationCode => {
            if (authorizationCode && authorizationCode.client.equals(client._id)
                /* && authorizationCode.redirectUri === redirectUri */) {
                return authorizationCode.remove();
            } else {
                return Promise.reject(new InvalidAuthorizationCodeError());
            }
        }).then(authorizationCode => {
            return new AccessToken({
                client: authorizationCode.client,
                user: authorizationCode.user,
                value: uid(256)
            }).save();
        }).then(accessToken => {
            callback(null, accessToken.value, null, { expires_in: 86400 });
        }).catch(err => {
            if (err instanceof InvalidAuthorizationCodeError) {
                return callback(null, false)
            } else {
                return callback(err)
            }
        })
}));

module.exports.authorization = [
    oauth2_server.authorize(function (clientId, redirectUri, callback) {
        Client.findOne({ id: clientId })
            .then(client => {
                if (client/* && client.redirectUri === redirectUri */) {
                    return callback(null, client, redirectUri);
                } else {
                    return callback(null, false);
                }
            }).catch(err => callback(err));
    }), function (req, res, next) {
        res.render('oauth2/authorization_dialog', {
            user: req.user,
            client: req.oauth2.client,
            transactionID: req.oauth2.transactionID
        });
    }
]

module.exports.decision = [
    oauth2_server.decision()
]

module.exports.token = [
    oauth2_server.token(),
    oauth2_server.errorHandler()
]