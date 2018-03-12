'use strict';
const express = require('express');
const router = express.Router();
const appController = require('../controllers/appcontroller');

router.get('/', appController.index);

router.get('/email_test', appController.email_test);

module.exports = router;