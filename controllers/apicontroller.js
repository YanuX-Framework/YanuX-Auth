'use strict';

const passport = require('passport');
const jwt = require('jsonwebtoken');
const AccessToken = require('../models/accesstoken');

exports.verifyOAuth2 = function (req, res, next) {
    const response = req.authInfo;
    jwt.sign(response, req.app.get('config').keys.private_key, { algorithm: 'RS256' }, (err, token) => {
        if (err) { next(err) } else { res.json({ response: response, jwt: token }); }
    });
}

// TODO:
// - Implement token introspection endpoint:
//   * https://www.oauth.com/oauth2-servers/token-introspection-endpoint/
//   * https://tools.ietf.org/html/rfc7662
// -----------------------------------------------------------------------------
exports.oauth2Introspection = function (req, res, next) {
    passport.authenticate('basic',
        { session: false, failWithError: true },
        function (err, user, info) {
            if (err) {
                next(err);
            } else if (!user) {
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
                }).catch(err => res.json({
                    active: false
                }))
            }
        })(req, res, next)
}