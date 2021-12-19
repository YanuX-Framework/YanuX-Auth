'use strict';

const passport = require('passport');
const { SignJWT } = require('jose');
const AccessToken = require('../models/accesstoken');
const configure = require('../configure');
const config = configure();

// -----------------------------------------------------------------------------
// - Custom Token Introspection Endpoint:
// -----------------------------------------------------------------------------
exports.verifyOAuth2 = function (req, res) {
    const response = req.authInfo;
    const keys = req.app.get('config').keys
    new SignJWT(response)
        .setProtectedHeader({
            alg: 'RS256',
            jku: `${config.open_id_connect.iss}/api/jwks`,
            kid: keys.private_jwk.kid
        })
        .setIssuedAt()
        .setIssuer(config.open_id_connect.iss)
        .setAudience(response.client && response.client.id ? response.client.id : '')
        .setExpirationTime((config.open_id_connect.expires_in / 1000) + 's')
        .setSubject(req.user && req.user.email ? req.user.email : '')
        .sign(keys.private_key)
        .then(jwt => { res.json({ response, jwt }) })
        .catch(e => { res.status(500); res.json(e); })
}

// -----------------------------------------------------------------------------
// - Standard Token Introspection Endpoint:
//   * https://www.oauth.com/oauth2-servers/token-introspection-endpoint/
//   * https://tools.ietf.org/html/rfc7662
// -----------------------------------------------------------------------------
// TODO: Should I use 'oauth2-resource-server-http-basic-strategy' with a static
// config file or should I develop a more sophisticated solution?
// -----------------------------------------------------------------------------
exports.oauth2Introspection = function (req, res, next) {
    passport.authenticate('client-basic' /*'oauth2-resource-server-http-basic-strategy'*/, {
        session: false,
        failWithError: true
    }, function (err, user) {
        if (err) { next(err); }
        else if (!user) {
            res.status(401).json({
                error: "invalid_client",
                error_description: "The client authentication was invalid"
            })
        } else {
            AccessToken.findOne({
                token: AccessToken.hashToken(req.body.token),
                expirationDate: { $gt: new Date() }
            }).populate('user').populate('client').then(accessToken => {
                res.json({
                    active: true,
                    scope: accessToken.scope.join(' '),
                    client_id: accessToken.client.id,
                    username: accessToken.user.email,
                    exp: accessToken.expirationDate
                })
            }).catch(() => res.json({ active: false }))
        }
    })(req, res, next)
}

exports.publicKey = function (req, res) {
    res.set('Content-Type', 'application/x-pem-file').send(req.app.get('config').keys.public_key_pem);
}

exports.jwks = function (req, res) {
    res.json({ keys: [config.keys.public_jwk] })
}