var express = require('express');
var router = express.Router();
var Nav = require('../models/nav');

router.get('/', function (req, res, next) {
  res.render('index', {
    nav: new Nav('Home')
  });
});

module.exports = router;