'use strict';

const jwt = require('jsonwebtoken');

exports.verifyOAuth2 = function (req, res, next) {
    const response = req.authInfo;
    jwt.sign(response, req.app.get('config').keys.private_key,
        { algorithm: 'RS256' },
        function (err, token) {
            if (err) {
                next(err)
            } else {
                res.json({
                    response: response,
                    jwt: token
                });
            }
        });
}