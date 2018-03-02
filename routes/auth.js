var express = require('express');
var router = express.Router();
var Nav = require('../models/nav');

router.get('/login', function (req, res, next) {
    res.render('auth/login', {
        nav: new Nav('Login')
    });
});

router.get('/register', function (req, res, next) {
    res.render('auth/register', {
        nav: new Nav('Register')
    });
});

module.exports = router;