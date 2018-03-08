var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController')
var { check, validationResult } = require('express-validator/check');
var { matchedData, sanitize } = require('express-validator/filter');

router.get('/login', userController.login_form);
router.post('/login', userController.login);

router.get('/register', userController.register_form);
router.post('/register', userController.register_validation, userController.register);

router.get('/logout', userController.logout);

module.exports = router;