'use strict';

// -----------------------------------------------------------------------------
// -- User Authentication Controller -------------------------------------------
// -----------------------------------------------------------------------------
// Most of the heavy lifting is done behind the scenes thanks to 'passport-local-mongoose':
// https://github.com/saintedlama/passport-local-mongoose
// To implement the 'Remember Me' feature, it is combined with 'passport-remember-me':
// https://github.com/jaredhanson/passport-remember-me
// -----------------------------------------------------------------------------
const passport = require('passport');
const { check, validationResult } = require('express-validator');
// -----------------------------------------------------------------------------
// TODO: Perhaps remove this require since it's not currently needed!
// var { matchedData, sanitize } = require('express-validator');
// -----------------------------------------------------------------------------
const User = require('../models/user');
const RememberMeToken = require('../models/remembermetoken');
const RememberMeStrategy = require('../utils/remembermestrategy');

module.exports.login_form = function (req, res, next) {
    res.render('auth/login', {
        title: 'Login',
        user: req.user,
        error: req.flash('error')
    });
};

module.exports.login = [
    passport.authenticate('local', {
        failureRedirect: '/auth/login',
        failureFlash: true
    }),
    function(req, res, next) {
        // TODO: Check if I can use a passport.authenticate callback instead of redefining the next middleware in-place.
        if (req.body.remember_me) {
            let rmtoken = new RememberMeToken({ user: req.user });
            let plainToken = rmtoken.generateToken();
            rmtoken.save().then(() => {
                let cookie = { email: req.user.email, token: plainToken };
                res.cookie('remember_me', cookie, RememberMeStrategy.cookieOptions);
                res.redirect(req.session.returnTo ? req.session.returnTo : '/');
            });
        } else {
            res.redirect(req.session.returnTo ? req.session.returnTo : '/');
        }
    }
];

module.exports.register_form = function (req, res, next) {
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

module.exports.register_validation = [
    email_check,
    password_check,
    confirm_password_check
];

module.exports.register = function (req, res, next) {
    const errors = validationResult(req);
    for (const error of errors.array()) {
        req.flash('error', error.msg);
    }
    if (errors.isEmpty()) {
        // TODO: I should probably also implement send an e-mail to the user so that she HAS to validate the account before using it.
        User.register(new User({ email: req.body.email }), req.body.password,
            function () {
                passport.authenticate('local')(req, res, function (err) {
                    if (err) {
                        req.flash('error', err.message);
                        res.redirect(req.originalUrl);
                    } else {
                        res.redirect('/');
                    }
                })
            });
    } else {
        res.redirect(req.originalUrl);
    }
};

module.exports.change_password_form = function (req, res, next) {
    res.render('auth/change_password', {
        title: 'Change Password',
        user: req.user,
        error: req.flash('error')
    });
};

module.exports.change_password_validation = [
    password_check,
    confirm_password_check
];

module.exports.change_password = function (req, res, next) {
    const errors = validationResult(req);
    for (const error of errors.array()) {
        req.flash('error', error.msg);
    }
    if (errors.isEmpty()) {
        let user = req.user;
        user.changePassword(req.body.old_password, req.body.password)
            .then(user => user.save())
            .then(res.redirect('/'))
            .catch(err => {
                req.flash('error', err.message);
                res.redirect(req.originalUrl)
            });
    } else {
        res.redirect(req.originalUrl);
    }
};

module.exports.reset_password_validation = [
    email_check
];

module.exports.reset_password_form = function (req, res, next) {
    res.render('auth/reset_password', {
        title: 'Reset Password',
        user: req.user,
        error: req.flash('error')
    });
};

module.exports.reset_password = function (req, res, next) {
    const errors = validationResult(req);
    for (const error of errors.array()) {
        req.flash('error', error.msg);
    }
    if (errors.isEmpty()) {
        let email = req.body.email;
        let reset_password_url = req.protocol + '://' + req.get('host') + '/auth/reset_password';
        User.findOne({ email: email }).then(user => {
            if (!user) {
                throw new Error('The e-mail address you provided is not registered.');
            } else {
                reset_password_url += '/email/' + user.email + '/token/' +  encodeURIComponent(user.generateResetPasswordToken());
                return user.save();
            }
        }).then(() => req.app.locals.email.send({
            template: 'reset_password',
            message: {
                to: email
            },
            locals: {
                subject: 'YanuX - Reset Password',
                reset_password_url: reset_password_url
            }
        })).then(() => res.render('message', {
            title: 'Password Reset Link Sent',
            message: 'We have sent you message with a link that you can be used to reset your password.',
            user: req.user,
            error: req.flash('error')
        })
        ).catch(err => {
            req.flash('error', err.message);
            res.redirect(req.originalUrl);
        });
    } else {
        res.redirect(req.originalUrl);
    }
};

module.exports.reset_password_url_form = function (req, res, next) {
    let email = req.params.email;
    let plainToken = req.params.token;
    let hashedToken = User.hashToken(plainToken);
    User.fetchUserByResetPasswordToken(email, hashedToken)
        .then(user => {
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

module.exports.reset_password_url_validation = [
    password_check,
    confirm_password_check
];

module.exports.reset_password_url = function (req, res, next) {
    const errors = validationResult(req);
    for (const error of errors.array()) {
        req.flash('error', error.msg);
    }
    if (errors.isEmpty()) {
        let email = req.params.email;
        let plainToken = req.params.token;
        let hashedToken = User.hashToken(plainToken);
        User.fetchUserByResetPasswordToken(email, hashedToken)
            .then(user => {
                if (user) {
                    user.setPassword(req.body.password)
                        .then(user => user.save())
                        .then(user => user.clearResetPasswordToken())
                        .then(() => res.render('message', {
                            title: 'Password Reset',
                            message: 'You can now login using your new password.',
                            user: req.user,
                            error: req.flash('error')
                        })).catch(err => {
                            req.flash('error', err.message);
                            res.redirect(req.originalUrl);
                        });
                } else {
                    throw new Error('Invalid password reset token');
                }
            });
    } else {
        res.redirect(req.originalUrl);
    }
};

module.exports.logout = function (req, res, next) {
    let rememberMeCookie = req.cookies['remember_me'];
    let logout = function (req, res) {
        res.clearCookie('remember_me');
        req.logout();
        res.redirect('/');
    }
    if (rememberMeCookie) {
        RememberMeToken.remove({
            user: req.user,
            token: RememberMeToken.hashToken(rememberMeCookie.token)
        }).then(() => logout(req, res));
    } else {
        logout(req, res);
    }

};