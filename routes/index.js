'use strict';
const express = require('express');
const router = express.Router();
const appController = require('../controllers/appcontroller');

router.get('/', appController.index);

// TODO: Remove this once I'm sure that e-mail sending works well.
//router.get('/emailtest', appController.emailtest);

module.exports = router;