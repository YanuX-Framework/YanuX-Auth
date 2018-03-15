'use strict';
const express = require('express');
const router = express.Router();
const userController = require('../controllers/usercontroller')

router.get('/login',
    userController.login_form);

router.post('/login',
    userController.login);

router.get('/register',
    userController.register_form);

router.post('/register',
    userController.register_validation,
    userController.register);

router.get('/change_password',
    userController.change_password_form);

router.post('/change_password',
    userController.change_password_validation,
    userController.change_password);

router.get('/logout',
    userController.logout);

module.exports = router;