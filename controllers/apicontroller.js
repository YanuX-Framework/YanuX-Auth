'use strict';

const jwt = require('jsonwebtoken');

exports.verifyOAuth2 = function (req, res, next) {
    jwt.sign({
        user: req.user
    }, req.app.get('config').keys.private_key,
        { algorithm: 'RS256' },
        function (err, token) {
            if (err) {
                next(err)
            } else {
                res.json({
                    user: req.user,
                    token: token
                });
            }
        });
}