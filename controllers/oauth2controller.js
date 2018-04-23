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
    /**
     * TODO: Decide whether I allow the redirect URI to be defined upon the Authorization Request,
     * or if I enforce it to be defined at the client registration level.
     **/
    new AuthorizationCode({
        client: client._id,
        user: user._id,
        code: uid(16),
        redirectUri: redirectUri
    }).save()
        .then(code => callback(null, code.code))
        .catch(err => callback(err))
}));

oauth2_server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, callback) {
    AuthorizationCode.findOne({ client: client, code: code })
        .then(authorizationCode => {
            if (authorizationCode && authorizationCode.redirectUri === redirectUri) {
                return authorizationCode.remove();
            } else {
                return Promise.reject(new InvalidAuthorizationCodeError());
            }
        }).then(authorizationCode => {
            return new AccessToken({
                client: authorizationCode.client,
                user: authorizationCode.user,
                token: uid(256)
            }).save();
        }).then(accessToken => {
            callback(null, accessToken.token, null, { expires_in: ((accessToken.expirationDate.getTime()) - (new Date().getTime())) / 1000 });
        }).catch(err => {
            if (err instanceof InvalidAuthorizationCodeError) {
                return callback(null, false)
            } else {
                return callback(err)
            }
        })
}));

oauth2_server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, callback) {
    // TODO: Implement Refresh Token: https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/refreshToken.js
    console.log("Refresh Token Request Received");
}));

oauth2_server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, body, authInfo, callback) {
    // TODO: Implement Client Credentials Token: https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/clientCredentials.js
    console.log("Client Credentials Request Received");
}));

oauth2_server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, body, authInfo, callback) {
    // TODO: Implement Password Token: https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/password.js
    console.log("Password Request Received");
}));

module.exports.authorization = [
    oauth2_server.authorize(function (clientId, redirectUri, callback) {
        Client.findOne({ id: clientId })
            .then(client => {
                // TODO: I'm not sure that the current implementation is fully compliant with: https://tools.ietf.org/html/rfc6749#section-3.1.2.3
                if (client && client.redirectUri === redirectUri) {
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