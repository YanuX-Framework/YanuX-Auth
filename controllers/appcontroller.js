'use strict';

module.exports.index = function (req, res, next) {
    res.render('index', {
        title: 'Home',
        user: req.user
    });
};