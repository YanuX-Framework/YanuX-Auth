'use strict';
const express = require('express');
const router = express.Router();
const appController = require('../controllers/appcontroller');

router.get('/', appController.index);

router.get('/emailtest', appController.emailtest);

module.exports = router;