'use strict';

const jwt = require('jsonwebtoken');

exports.verifyOAuth2 = function (req, res, next) {
    const response = req.authInfo;
    jwt.sign(response, req.app.get('config').keys.private_key, { algorithm: 'RS256' }, (err, token) => {
        if (err) { next(err) } else {
            res.json({ response: response, jwt: token });
        }
    });
}

// TODO:
// - Implement token introspection endpoint:
//   * https://www.oauth.com/oauth2-servers/token-introspection-endpoint/
//   * https://tools.ietf.org/html/rfc7662
// -----------------------------------------------------------------------------
// exports.oauth2Introspection = function (req, res, next) {
// }