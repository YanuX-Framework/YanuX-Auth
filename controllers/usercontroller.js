'use strict';
//// User Authentication Controller ////
// -----------------------------------------------------------------------------
// Most of the heavy lifting is done behind the scenes thanks to 'passport-local-mongoose':
// https://github.com/saintedlama/passport-local-mongoose
// To implement the 'Remember Me' feature, it is combine with 'passport-remember-me':
// https://github.com/jaredhanson/passport-remember-me
// -----------------------------------------------------------------------------
const mongoose = require('mongoose');
const passport = require('passport');
const crypto = require('crypto');
const { check, validationResult } = require('express-validator/check');
// -----------------------------------------------------------------------------
// TODO: Perhaps remove this require since it's not currently needed!
// var { matchedData, sanitize } = require('express-validator/filter');
// -----------------------------------------------------------------------------
const User = require('../models/user');
const RememberMeToken = require('../models/remembermetoken');
const RememberMeStrategy = require('../utils/remembermestrategy');

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
            let rmtoken = new RememberMeToken({ user: req.user._id })
            rmtoken.generateToken().then((plainToken) => rmtoken.save().then(() => {
                res.cookie('remember_me', plainToken, RememberMeStrategy.cookieOptions);
                res.redirect('/');
            }).catch((err) => console.error('RememberMeToken: ' + err)));
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
let email_check = check('email', 'You have not inserted a valid e-mail address.').isEmail();
let password_check = check('password', 'Your password is too short.').isLength({ min: 8 });
let confirm_password_check = check('confirm_password', 'You have not confirmed your password correctly.').exists()
    .custom((value, { req }) => value === req.body.password);

exports.register_validation = [
    email_check,
    password_check,
    confirm_password_check
];

exports.register = function (req, res, next) {
    const errors = validationResult(req);
    for (const error of errors.array()) {
        req.flash('error', error.msg);
    }
    if (errors.isEmpty()) {
        // TODO: I should probably also implement send an e-mail to the user so that she HAS to validate the account before using it.
        User.register(new User({ email: req.body.email }), req.body.password).then(
            (user) => {
                if (err) {
                    req.flash('error', err.message);
                    res.redirect('/auth/register');
                }
            }
        ).catch((err) => {
            passport.authenticate('local')(req, res, function () {
                res.redirect('/');
            });
        }
        );
    } else {
        res.redirect('/auth/register');
    }
};

exports.change_password_form = function (req, res, next) {
    res.render('auth/change_password', {
        title: 'Change Password',
        user: req.user,
        error: req.flash('error')
    });
};

exports.change_password_validation = [
    password_check,
    confirm_password_check
];

exports.change_password = function (req, res, next) {
    const errors = validationResult(req);
    for (const error of errors.array()) {
        req.flash('error', error.msg);
    }
    if (errors.isEmpty()) {
        let user = req.user;
        user.changePassword(req.body.old_password, req.body.password)
            .then(() => user.save())
            .then(() => res.redirect('/'))
            .catch((err) => {
                req.flash('error', err.message);
                res.redirect('/auth/change_password')
            });
    } else {
        res.redirect('/auth/change_password');
    }
};

exports.reset_password_validation = [
    email_check
];

exports.reset_password_form = function (req, res, next) {
    res.render('auth/reset_password', {
        title: 'Reset Password',
        user: req.user,
        error: req.flash('error')
    });
};

exports.reset_password = function (req, res, next) {
    const errors = validationResult(req);
    for (const error of errors.array()) {
        req.flash('error', error.msg);
    }
    if (errors.isEmpty()) {
        let email = req.body.email;
        let reset_password_url = req.protocol + '://' + req.get('host') + '/auth/reset_password';
        User.findOne({ email: email }).then((user) => {
            if (!user) {
                throw new Error('The e-mail address you provided is not registered.');
            }
            reset_password_url += '/email/' + user.email + '/token/' + user.generateResetPasswordToken();
            user.save();
        }).then((user) => {
            req.app.locals.email.send({
                template: 'reset_password',
                message: {
                    to: email
                },
                locals: {
                    subject: 'YanuX - Reset Password',
                    reset_password_url: reset_password_url
                }
            })
        }).then(() => {
            res.render('message', {
                title: 'Password Reset Link Sent',
                message: 'We have sent you message with a link that you can be used to reset your password.',
                user: req.user,
                error: req.flash('error')
            });
        }).catch((err) => {
            req.flash('error', err.message);
            res.redirect('/auth/reset_password');
        });
    } else {
        res.redirect('/auth/reset_password');
    }
};

exports.reset_password_url_form = function (req, res, next) {
    let email = req.params.email;
    let plainToken = req.params.token;
    let hashedToken = User.hashToken(plainToken);
    User.findOneUserByEmailAndValidResetPasswordToken(email, hashedToken)
        .then((user) => {
            if (user) {
                res.render('auth/reset_password_url', {
                    title: 'Reset Password',
                    user: req.user,
                    email: email,
                    token: plainToken,
                    error: req.flash('error')
                });
            } else {
                next(new Error('Invalid password reset token'));
            }
        });
};

exports.reset_password_url_validation = [
    password_check,
    confirm_password_check
];

exports.reset_password_url = function (req, res, next) {
    const errors = validationResult(req);
    for (const error of errors.array()) {
        req.flash('error', error.msg);
    }
    if (errors.isEmpty()) {
        let email = req.params.email;
        let plainToken = req.params.token;
        let hashedToken = User.hashToken(plainToken);
        User.findOneUserByEmailAndValidResetPasswordToken(email, hashedToken)
            .then((user) => {
                if (user) {
                    user.setPassword(req.body.password)
                        .then(() => user.clearResetPasswordToken())
                        .then(() => user.save())
                        .then(() => res.render('message', {
                            title: 'Password Reset',
                            message: 'You can now login using your new password.',
                            user: req.user,
                            error: req.flash('error')
                        }));
                } else {
                    next(new Error('Invalid password reset token'));
                }
            });
    } else {
        res.redirect(req.originalUrl);
    }
};

exports.logout = function (req, res, next) {
    res.clearCookie('remember_me');
    req.logout();
    res.redirect('/');
};