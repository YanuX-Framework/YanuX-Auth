//// User Authentication Controller ////
// Most of the heavy lifting is done behind the scenes thanks to 'passport-local-mongoose':
// https://github.com/saintedlama/passport-local-mongoose
// To implement the 'Remember Me' feature, it is combine with 'passport-remember-me':
// https://github.com/jaredhanson/passport-remember-me
// -----------------------------------------------------------------------------
var User = require('../models/user');
var RememberMeToken = require('../models/remembermetoken');
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
        if (req.body.remember_me) {
            let rmtoken = new RememberMeToken({ userId: req.user.email })
            rmtoken.save(function () {
                res.cookie('remember_me', rmtoken.token, { path: '/', httpOnly: true, maxAge: 604800000 }); // 7 days
                res.redirect('/');
            })
        } else {
            res.redirect('/');
        }
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
        // TODO: I should probably also implement send an e-mail to the user so that she HAS to validate the account before using it.
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
    res.clearCookie('remember_me');
    req.logout();
    res.redirect('/');
};
