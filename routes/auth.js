var express = require('express');
var mongoose = require("mongoose");
var passport = require("passport");
var User = require("../models/User");

var router = express.Router();

router.get('/login', function (req, res, next) {
    res.render('auth/login', {
        title: 'Login'
    });
});

router.post('/login', function (req, res, next) {
    passport.authenticate('local')(req, res, function () {
        res.redirect('/');
    });
});

router.get('/register', function (req, res, next) {
    res.render('auth/register', {
        title: 'Register'
    });
});

router.post('/register', function (req, res, next) {
    console.log('Register Email: '+req.body.email+" Password: "+req.body.password);
    User.register(new User({ email: req.body.email }), req.body.password, function (err, user) {
        if (err) {
            console.debug("Passport <ERROR>: "+err);
            return res.render('auth/register', { title: 'Register', user: user });
        }
        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});

router.get('/logout', function (req, res, next) {
    req.logout();
    res.redirect('/');
});

module.exports = router;