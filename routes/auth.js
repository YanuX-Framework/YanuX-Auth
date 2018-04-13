'use strict';

const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const userController = require('../controllers/authcontroller')

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
    authUtils.ensureLoggedIn,
    userController.change_password_form);

router.post('/change_password',
    authUtils.ensureLoggedIn,
    userController.change_password_validation,
    userController.change_password);

router.get('/reset_password',
    userController.reset_password_form);

router.post('/reset_password',
    userController.reset_password_validation,
    userController.reset_password);

router.get('/reset_password/email/:email/token/:token',
    userController.reset_password_url_form);

router.post('/reset_password/email/:email/token/:token',
    userController.reset_password_url_validation,
    userController.reset_password_url);

router.get('/logout',
    userController.logout);

module.exports = router;