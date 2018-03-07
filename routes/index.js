var express = require('express');
var router = express.Router();
var appController = require('../controllers/appController');

router.get('/', appController.index);

module.exports = router;