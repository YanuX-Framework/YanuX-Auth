const crypto = require('crypto');
const CustomStrategy = require('passport-custom').Strategy;
const Client = require('../models/client');
const AuthorizationCode = require('../models/authorizationcode');
const base64url = require('base64url')


module.exports = new CustomStrategy(function (req, callback) {
    if (req.body && req.body.grant_type === 'authorization_code' && req.body.client_id && req.body.code && req.body.redirect_uri && req.body.code_verifier) {
        Client.findOne({ id: req.body.client_id })
            .then(client => {
                const hashCode = AuthorizationCode.hashCode(req.body.code);
                return AuthorizationCode.findOne({
                    client: client._id,
                    code: hashCode,
                    redirectUri: req.body.redirect_uri
                })
            }).then(authorizationCode => {
                if (authorizationCode && authorizationCode.codeChallenge && authorizationCode.codeChallengeMethod === 'plain') {
                    return authorizationCode.codeChallenge === req.body.code_verifier ? callback(null, authorizationCode.client) : callback(null, false);
                } else if (authorizationCode && authorizationCode.codeChallenge && authorizationCode.codeChallengeMethod === 'S256') {
                    const codeChallenge = authorizationCode.codeChallenge.replace('=', '');
                    const codeVerifier = base64url.fromBase64(crypto.createHash('sha256').update(req.body.code_verifier).digest('base64').replace('=', ''));
                    return codeChallenge === codeVerifier ? callback(null, authorizationCode.client) : callback(null, false);
                } else { callback(null, false); }
            }).catch(err => callback(err));
    } else { callback(null, false); }
});