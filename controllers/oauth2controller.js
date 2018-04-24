'use strict';

const oauth2orize = require('oauth2orize');
const uid = require('uid2');
const User = require('../models/user');
const Client = require('../models/client');
const AccessToken = require('../models/accesstoken');
const RefreshToken = require('../models/refreshtoken');
const AuthorizationCode = require('../models/authorizationcode');
const OAuth2InvalidRedirectURIError = require('../errors/oauth2invalidredirecturierror');
const OAuth2InvalidAuthorizationCodeError = require('../errors/oauth2invalidauthorizationcodeerror');

const OAuth2Server = oauth2orize.createServer();

OAuth2Server.serializeClient(function (client, callback) {
    return callback(null, client._id);
});

OAuth2Server.deserializeClient(function (id, callback) {
    Client.findById(id)
        .then(client => callback(null, client))
        .catch(err => callback(err))
});

const OAuth2ServerAuthorization = [OAuth2Server.authorize(function (clientId, redirectUri, callback) {
    // TODO: I'm not sure that the current implementation is fully compliant with: https://tools.ietf.org/html/rfc6749#section-3.1.2.3
    Client.findOne({ id: clientId, redirectUri: redirectUri })
        .then(client => {
            if (client) {
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
}]

OAuth2Server.grant(oauth2orize.grant.code(function (client, redirectUri, user, ares, callback) {
    if (redirectUri && client.redirectUri !== redirectUri) {
        callback(new OAuth2InvalidRedirectURIError());
    } else {
        new AuthorizationCode({
            client: client._id,
            user: user._id,
            code: uid(16),
            redirectUri: redirectUri
        }).save()
            .then(code => callback(null, code.code))
            .catch(err => callback(err));
    }
}));

OAuth2Server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, callback) {
    AuthorizationCode.findOne({ client: client, code: code, redirectUri: redirectUri })
        .then(authorizationCode => {
            if (authorizationCode) {
                return authorizationCode.remove();
            } else {
                return Promise.reject(new OAuth2InvalidAuthorizationCodeError());
            }
        }).then(authorizationCode => {
            return new AccessToken({
                client: authorizationCode.client,
                user: authorizationCode.user,
                token: uid(256),
            }).save();
        }).then(accessToken => {
            return new RefreshToken({
                client: accessToken.client,
                user: accessToken.user,
                accessToken: accessToken,
                token: uid(256),
            }).save();
        }).then(refreshToken => {
            callback(null,
                refreshToken.token,
                refreshToken.accessToken.token,
                { expires_in: Math.floor((refreshToken.accessToken.expirationDate.getTime() - new Date().getTime()) / 1000) })
        }).catch(err => {
            if (err instanceof OAuth2InvalidAuthorizationCodeError) {
                return callback(null, false)
            } else {
                return callback(err)
            }
        })
}));

OAuth2Server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, callback) {
    // TODO: Implement Refresh Token: https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/refreshToken.js
    console.log("Refresh Token Request Received");
    return callback(null, false);
}));

OAuth2Server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, body, authInfo, callback) {
    // TODO: Implement Client Credentials Token: https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/clientCredentials.js
    console.log("Client Credentials Request Received");
    return callback(null, false);
}));

OAuth2Server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, body, authInfo, callback) {
    // TODO: Implement Password Token: https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/password.js
    console.log("Password Request Received");
    return callback(null, false);
}));

module.exports.authorization = OAuth2ServerAuthorization;

module.exports.decision = [
    OAuth2Server.decision()
]

module.exports.token = [
    OAuth2Server.token(),
    OAuth2Server.errorHandler()
]