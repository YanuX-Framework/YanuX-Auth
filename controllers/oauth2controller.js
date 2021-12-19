'use strict';

// TODO:
// - Integrate OAuth 2.0 Device Flow for Browserless and Input Constrained Devices (https://tools.ietf.org/html/draft-ietf-oauth-device-flow-07):
//   * https://www.npmjs.com/package/oauth2orize-device-code
//   * https://github.com/jaredhanson/oauth2orize-device-code

const { SignJWT } = require('jose');
const configure = require('../configure');
const config = configure();
const openIdConnectConfig = config.open_id_connect;
const keys = config.keys;

const oauth2orize = require('oauth2orize');
const oauth2orize_ext = require('oauth2orize-openid');
const oauth2orizeOptions = {
    modes: {
        fragment: require('oauth2orize/lib/response/fragment'),
        query: require('oauth2orize/lib/response/query')
    }
}

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

/**
 * Registers a function used to serialize client objects into the session.
 */
OAuth2Server.serializeClient(function (client, callback) {
    return callback(null, client._id);
});

/**
 * Registers a function used to deserialize client objects out of the session.
 */
OAuth2Server.deserializeClient(function (id, callback) {
    Client.findById(id)
        .then(client => callback(null, client))
        .catch(err => callback(err))
});

/**
 * oauth2orize-response-mode - Parse Request Extensions
 */
OAuth2Server.grant(require('oauth2orize-response-mode').extensions());

/**
 * Proof Key for Code Exchange by OAuth Public Clients
 * - https://tools.ietf.org/html/rfc7636
 * Implemented thanks to the "oauth2orize-pkce" package.
 */
OAuth2Server.grant(require('oauth2orize-pkce').extensions());

/**
 * Authorization Request Dialog
 */
const OAuth2ServerAuthorization = [
    /**
     * Parses requests to obtain authorization.
     */
    OAuth2Server.authorize(function (clientId, redirectUri, callback) {
        // NOTE: I'm not sure that the current implementation is fully compliant with: https://tools.ietf.org/html/rfc6749#section-3.1.2.3
        Client.findOne({ id: clientId, redirectUri: redirectUri })
            .then(client => {
                if (client) {
                    return callback(null, client, redirectUri);
                } else {
                    return callback(null, false);
                }
            }).catch(err => callback(err));
    }),
    /**
     * Displays the Autorization Request Dialog
     */
    function (req, res, next) {
        res.render('oauth2/authorization_dialog', {
            title: 'Authorization Request',
            user: req.user,
            client: req.oauth2.client,
            transactionID: req.oauth2.transactionID
        });
    }]

// -------------------------------------------------------------------------- //
// ------------------------ Some Re-usable Functions ------------------------ //
// -------------------------------------------------------------------------- //
// Function that generates an ID Token
const generateIdToken = (client, user, ares, req, callback) => {
    new SignJWT({ nonce: req.nonce, email: user.email })
        .setProtectedHeader({
            alg: 'RS256',
            jku: `${config.open_id_connect.iss}/api/jwks`,
            kid: keys.private_jwk.kid
        })
        .setIssuedAt()
        .setIssuer(openIdConnectConfig.iss)
        .setAudience(client.id)
        .setExpirationTime((openIdConnectConfig.expires_in / 1000) + 's')
        .setSubject(user.email)
        .sign(keys.private_key)
        .then(jwt => callback(null, jwt))
        .catch(e => callback(e))
}

// Generates and Access Token
const generateToken = (client, user, ares, req, callback) => {
    let accessTokenUid = AccessToken.tokenUid();
    return new AccessToken({
        client: client,
        user: user,
        tokenHash: accessTokenUid,
        scope: req.scope ? req.scope : null
    }).save().then(accessToken => {
        callback(null, accessTokenUid, null,
            { expires_in: Math.floor((accessToken.expirationDate.getTime() - new Date().getTime()) / 1000) });
    }).catch(err => callback(err));
}

// Generates an Authorization Code
const generateCode = (client, redirectUri, user, ares, req, callback) => {
    if (redirectUri && client.redirectUri !== redirectUri) {
        callback(new OAuth2InvalidRedirectURIError());
    } else {
        const authorizationCodeUid = AuthorizationCode.codeUid();
        new AuthorizationCode({
            client: client._id,
            user: user._id,
            codeHash: authorizationCodeUid,
            redirectUri: redirectUri,
            scope: req.scope ? req.scope : [],
            codeChallenge: req.codeChallenge,
            codeChallengeMethod: req.codeChallengeMethod
        }).save()
            .then(code => callback(null, authorizationCodeUid))
            .catch(err => callback(err));
    }
}
// -------------------------------------------------------------------------- //

/**
 * Implicit Grant
 * https://github.com/jaredhanson/oauth2orize/blob/master/lib/grant/token.js
 * TODO:
 * - Implement 
 */
OAuth2Server.grant(oauth2orize.grant.token(oauth2orizeOptions, generateToken));

/**
 * Authorization Code Grant
 * https://github.com/jaredhanson/oauth2orize/blob/master/lib/grant/code.js
 */
OAuth2Server.grant(oauth2orize.grant.code(oauth2orizeOptions, generateCode));

/**
 * Authorization Code Exchange
 * https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/authorizationCode.js
 */
OAuth2Server.exchange(oauth2orize.exchange.authorizationCode(function (client, code, redirectUri, callback) {
    let accessTokenUid, refreshTokenUid;
    AuthorizationCode.findOneAndDelete({
        client: client,
        code: AuthorizationCode.hashCode(code),
        redirectUri: redirectUri,
        expirationDate: { $gt: new Date() }
    }).then(authorizationCode => {
        if (authorizationCode) {
            accessTokenUid = AccessToken.tokenUid();
            return new AccessToken({
                client: authorizationCode.client,
                user: authorizationCode.user,
                scope: authorizationCode.scope,
                tokenHash: accessTokenUid
            }).save();
        } else {
            return Promise.reject(new OAuth2InvalidAuthorizationCodeError());
        }
    }).then(accessToken => {
        refreshTokenUid = RefreshToken.tokenUid();
        return new RefreshToken({
            client: accessToken.client,
            user: accessToken.user,
            accessToken: accessToken,
            tokenHash: refreshTokenUid
        }).save();
    }).then(refreshToken => {
        callback(null,
            accessTokenUid,
            refreshTokenUid,
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
    let accessTokenUid, refreshTokenUid;
    RefreshToken.findOneAndDelete({
        token: RefreshToken.hashToken(refreshToken),
        client: client,
        expirationDate: { $gt: new Date() }
    }).then(refToken => {
        if (refToken) {
            //NOTE: I'm invalidating all old tokens! I'm not sure if I should do it or not!
            return AccessToken.findByIdAndDelete(refToken.accessToken);
        } else {
            return Promise.reject(new OAuth2InvalidRefreshToken());
        }
    }).then(accessToken => {
        accessTokenUid = AccessToken.tokenUid();
        return new AccessToken({
            client: accessToken.client,
            user: accessToken.user,
            scope: scope,
            tokenHash: accessTokenUid
        }).save();
    }).then(accessToken => {
        refreshTokenUid = RefreshToken.tokenUid();
        return new RefreshToken({
            client: accessToken.client,
            user: accessToken.user,
            accessToken: accessToken,
            tokenHash: refreshTokenUid
        }).save();
    }).then(refreshToken => {
        callback(null, accessTokenUid, refreshTokenUid,
            { expires_in: Math.floor((refreshToken.expirationDate.getTime() - new Date().getTime()) / 1000) })
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
    let accessTokenUid = AccessToken.tokenUid();
    return new AccessToken({
        client: client,
        tokenHash: accessTokenUid,
        scope: scope
    }).save().then(accessToken => {
        callback(null, accessTokenUid, null,
            { expires_in: Math.floor((accessToken.expirationDate.getTime() - new Date().getTime()) / 1000) });
    }).catch(err => callback(err));
}));

/**
 * Username Password Grant
 * https://github.com/jaredhanson/oauth2orize/blob/master/lib/exchange/password.js
 */
OAuth2Server.exchange(oauth2orize.exchange.password(function (client, username, password, scope, body, authInfo, callback) {
    let accessTokenUid, refreshTokenUid;
    User.authenticate()(username, password).then(authentication => {
        if (authentication && authentication.user) {
            accessTokenUid = AccessToken.tokenUid();
            return new AccessToken({
                client: client,
                user: authentication.user,
                scope: scope,
                tokenHash: accessTokenUid
            }).save();
        } else {
            return Promise.reject(new OAuth2InvalidUsernameOrPassword());
        }
    }).then(accessToken => {
        refreshTokenUid = RefreshToken.tokenUid();
        return new RefreshToken({
            client: accessToken.client,
            user: accessToken.user,
            accessToken: accessToken,
            tokenHash: refreshTokenUid
        }).save();
    }).then(refreshToken => {
        callback(null, accessTokenUid, refreshTokenUid,
            { expires_in: Math.floor((refreshToken.accessToken.expirationDate.getTime() - new Date().getTime()) / 1000) })
    }).catch(err => {
        if (err instanceof OAuth2InvalidUsernameOrPassword) {
            return callback(null, false);
        } else {
            return callback(err)
        }
    })
}));


// Register supported OpenID Connect 1.0 grant types.
// Implicit Flow
// id_token grant type.
OAuth2Server.grant(oauth2orize_ext.grant.idToken(oauth2orizeOptions, generateIdToken));
// 'id_token token' grant type.
OAuth2Server.grant(oauth2orize_ext.grant.idTokenToken(oauth2orizeOptions, generateToken, generateIdToken));
// Hybrid Flow
// 'code id_token' grant type.
OAuth2Server.grant(oauth2orize_ext.grant.codeIdToken(oauth2orizeOptions, generateCode, generateIdToken));
// 'code token' grant type.
OAuth2Server.grant(oauth2orize_ext.grant.codeToken(oauth2orizeOptions, generateToken, generateCode));
// 'code id_token token' grant type.
OAuth2Server.grant(oauth2orize_ext.grant.codeIdTokenToken(oauth2orizeOptions, generateToken, generateCode, generateIdToken));

/**
 * Export Authorization Request Dialog
 */
module.exports.authorization = OAuth2ServerAuthorization;

/**
 * Handle a user's response to an authorization dialog.
 */
module.exports.decision = [
    OAuth2Server.decision()
]

/**
 * Handle requests to exchange an authorization grant for an access token,
 * otherwise respond to errors encountered in OAuth 2.0 endpoints.
 */
module.exports.token = [
    OAuth2Server.token(),
    OAuth2Server.errorHandler()
]