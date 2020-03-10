'use strict';

const crypto = require('crypto');
const CustomStrategy = require('passport-custom').Strategy;
const Client = require('../models/client');
const AuthorizationCode = require('../models/authorizationcode');
const base64url = require('base64url')

module.exports = new CustomStrategy(function (req, callback) {
    const grant_type = req.body.grant_type || req.headers.grant_type;
    const client_id = req.body.client_id || req.headers.client_id;
    const code = req.body.code || req.headers.code;
    const redirect_uri = req.body.redirect_uri || req.headers.redirect_uri;
    const code_verifier = req.body.code_verifier || req.headers.code_verifier;
    if (grant_type === 'authorization_code' && client_id && code && redirect_uri && code_verifier) {
        Client.findOne({ id: client_id })
            .then(client => {
                const hashCode = AuthorizationCode.hashCode(code);
                return AuthorizationCode.findOne({
                    client: client._id,
                    code: hashCode,
                    redirectUri: redirect_uri
                })
            }).then(authorizationCode => {
                if (authorizationCode && authorizationCode.codeChallenge && authorizationCode.codeChallengeMethod === 'plain') {
                    return authorizationCode.codeChallenge === code_verifier ? callback(null, authorizationCode.client) : callback(null, false);
                } else if (authorizationCode && authorizationCode.codeChallenge && authorizationCode.codeChallengeMethod === 'S256') {
                    const codeChallenge = authorizationCode.codeChallenge.replace('=', '');
                    const codeVerifier = base64url.fromBase64(crypto.createHash('sha256').update(code_verifier).digest('base64').replace('=', ''));
                    return codeChallenge === codeVerifier ? callback(null, authorizationCode.client) : callback(null, false);
                } else { callback(null, false); }
            }).catch(err => callback(err));
    } else { callback(null, false); }
});