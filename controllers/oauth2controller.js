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
const OAuth2InvalidRefreshToken = require('../errors/oauth2invalidrefreshtoken');
const OAuth2InvalidUsernameOrPassword = require('../errors/oauth2invalidusernameorpassword');
const OAuth2Server = oauth2orize.createServer();

OAuth2Server.serializeClient(function (client, callback) {
    return callback(null, client._id);
});

OAuth2Server.deserializeClient(function (id, callback) {
    Client.findById(id)
        .then(client => callback(null, client))
        .catch(err => callback(err))
});

/**
 * Authorization Request Dialog
 */
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
        title: 'Authorization Request',
        user: req.user,
        client: req.oauth2.client,
        transactionID: req.oauth2.transactionID
    });
}]

/**
 * Implicit Grant
 */
OAuth2Server.grant(oauth2orize.grant.token(function (client, user, ares, callback) {
    return new AccessToken({
        client: client,
        user: user,
        token: uid(256),
        scope: ares.scope ? ares.scope : null
    }).save().then(accessToken => {
        callback(null, accessToken.token, null,
            { expires_in: Math.floor((accessToken.expirationDate.getTime() - new Date().getTime()) / 1000) });
    }).catch(err => callback(err));
}));

/**
 * Authorization Code Response
 */
OAuth2Server.grant(oauth2orize.grant.code(function (client, redirectUri, user, ares, callback) {
    if (redirectUri && client.redirectUri !== redirectUri) {
        callback(new OAuth2InvalidRedirectURIError());
    } else {
        new AuthorizationCode({
            client: client._id,
            user: user._id,
            code: uid(16),
            redirectUri: redirectUri,
            scope: ares.scope ? ares.scope : null
        }).save()
            .then(code => callback(null, code.code))
            .catch(err => callback(err));
    }
}));

/**
 * Authorization Code Grant
 */
OAuth2Server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, callback) {
    AuthorizationCode.findOneAndRemove({
        client: client,
        code: code,
        redirectUri: redirectUri,
        expirationDate: { $gt: new Date() }
    }).then(authorizationCode => {
        if (authorizationCode) {
            return new AccessToken({
                client: authorizationCode.client,
                user: authorizationCode.user,
                scope: authorizationCode.scope,
                token: uid(256),
            }).save();
        } else {
            return Promise.reject(new OAuth2InvalidAuthorizationCodeError());
        }
    }).then(accessToken => {
        return new RefreshToken({
            client: accessToken.client,
            user: accessToken.user,
            accessToken: accessToken,
            token: uid(256),
        }).save();
    }).then(refreshToken => {
        callback(null,
            refreshToken.accessToken.token,
            refreshToken.token,
            { expires_in: Math.floor((refreshToken.accessToken.expirationDate.getTime() - new Date().getTime()) / 1000) })
    }).catch(err => {
        if (err instanceof OAuth2InvalidAuthorizationCodeError) {
            return callback(null, false)
        } else {
            return callback(err)
        }
    })
}));


/**
 * Refresh Token Grant
 * https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/refreshToken.js
 */
OAuth2Server.exchange(oauth2orize.exchange.refreshToken(function (client, refreshToken, scope, callback) {
    RefreshToken.findOneAndRemove({
        token: refreshToken,
        client: client,
        expirationDate: { $gt: new Date() }
    }).then(refToken => {
        if (refToken) {
            //NOTE: I'm invalidating all old tokens! I'm not sure if I should do it or not!
            return AccessToken.findByIdAndRemove(refToken.accessToken);
        } else {
            return Promise.reject(new OAuth2InvalidRefreshToken());
        }
    }).then(accessToken => {
        return new AccessToken({
            client: accessToken.client,
            user: accessToken.user,
            scope: scope,
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
        callback(null, refreshToken.accessToken.token, refreshToken.token,
            { expires_in: Math.floor((refreshToken.accessToken.expirationDate.getTime() - new Date().getTime()) / 1000) })
    }).catch(err => {
        if (err instanceof OAuth2InvalidRefreshToken) {
            return callback(null, false);
        } else {
            return callback(err)
        }
    })
}));

/**
 * Client Credentials Grant
 * https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/clientCredentials.js
 */
OAuth2Server.exchange(oauth2orize.exchange.clientCredentials(function (client, scope, body, authInfo, callback) {
    return new AccessToken({
        client: client,
        token: uid(256),
        scope: scope
    }).save().then(accessToken => {
        callback(null, accessToken.token, null,
            { expires_in: Math.floor((accessToken.expirationDate.getTime() - new Date().getTime()) / 1000) });
    }).catch(err => callback(err));
}));

/**
 * Username Password Grant
 * https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/password.js
 */
OAuth2Server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, body, authInfo, callback) {
    User.authenticate()(username, password).then(authentication => {
        if (authentication && authentication.user) {
            return new AccessToken({
                client: client,
                user: authentication.user,
                scope: scope,
                token: uid(256),
            }).save();
        } else {
            return Promise.reject(new OAuth2InvalidUsernameOrPassword());
        }
    }).then(accessToken => {
        return new RefreshToken({
            client: accessToken.client,
            user: accessToken.user,
            accessToken: accessToken,
            token: uid(256),
        }).save();
    }).then(refreshToken => {
        callback(null, refreshToken.accessToken.token, refreshToken.token,
            { expires_in: Math.floor((refreshToken.accessToken.expirationDate.getTime() - new Date().getTime()) / 1000) })
    }).catch(err => {
        if (err instanceof OAuth2InvalidUsernameOrPassword) {
            return callback(null, false);
        } else {
            return callback(err)
        }
    })
}));

module.exports.authorization = OAuth2ServerAuthorization;

module.exports.decision = [
    OAuth2Server.decision()
]

module.exports.token = [
    OAuth2Server.token(),
    OAuth2Server.errorHandler()
]