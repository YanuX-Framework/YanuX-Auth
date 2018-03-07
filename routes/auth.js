var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController')

router.get('/login', userController.login_form);
router.post('/login', userController.login);

router.get('/register', userController.register_form);
router.post('/register', userController.register);

router.get('/logout', userController.logout);

module.exports = router;