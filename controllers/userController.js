var User = require('../models/user');
var mongoose = require('mongoose');
var passport = require('passport');

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

exports.register = function (req, res, next) {
    var registration_error = false;

    if (req.body.password !== req.body.confirm_password) {
        req.flash('error', 'The password confirmation does not match the password.');
        registration_error = true;
    }
    if (registration_error) {
        res.redirect('/auth/register');
    }
    User.register(new User({ email: req.body.email }),
        req.body.password,
        function (err, user) {
            if (err) {
                req.flash('error', err.message);
                registration_error = true;
            }
            if (registration_error) {
                res.redirect('/auth/register');
            }
            passport.authenticate('local')(req, res, function () {
                res.redirect('/');
            });
        }
    );
};

exports.logout = function (req, res, next) {
    req.logout();
    res.redirect('/');
};
