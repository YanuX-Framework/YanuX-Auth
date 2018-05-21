'use strict';

exports.verifyOAuth2 = function (req, res, next) {
    res.json({ user: req.user });
}