var User = require('../models/user');
var mongoose = require('mongoose');
var passport = require('passport');
var { check, validationResult } = require('express-validator/check');
var { matchedData, sanitize } = require('express-validator/filter');

exports.login_form = function (req, res, next) {
    res.render('auth/login', {
        title: 'Login',
        user: req.user,
        error: req.flash('error')
    });
};

exports.login = function (req, res, next) {
    passport.authenticate('local', {
        failureRedirect: '/auth/login',
        failureFlash: true
    })(req, res, function () {
        res.redirect('/');
    });
};

exports.register_form = function (req, res, next) {
    res.render('auth/register', {
        title: 'Register',
        user: req.user,
        error: req.flash('error')
    });
};

// TODO: I should probably also impose these restrictions at the model level.
exports.register_validation = [
    check('email', 'You have not inserted a valid e-mail address.').isEmail(),
    check('password', 'Your password is too short.').isLength({ min: 8 }),
    check('confirm_password', 'You have not confirmed your password correctly.').exists()
        .custom((value, { req }) => value === req.body.password)
];
exports.register = function (req, res, next) {
    const errors = validationResult(req);
    for (const error of errors.array()) {
        req.flash('error', error.msg);
    }
    if (errors.isEmpty()) {
        User.register(new User({ email: req.body.email }),
            req.body.password,
            function (err, user) {
                if (err) {
                    req.flash('error', err.message);
                    res.redirect('/auth/register');
                } else {
                    passport.authenticate('local')(req, res, function () {
                        res.redirect('/');
                    });
                }
            }
        );
    } else {
        res.redirect('/auth/register');
    }
};

exports.logout = function (req, res, next) {
    req.logout();
    res.redirect('/');
};
