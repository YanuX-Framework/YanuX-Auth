'use strict';

const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const clientController = require('../controllers/clientcontroller')

router.get('/',
    authUtils.ensureLoggedIn,
    clientController.index);

router.get('/:clientId',
    authUtils.ensureLoggedIn,
    clientController.show);

router.delete('/:clientId',
    authUtils.ensureLoggedIn,
    clientController.delete);

module.exports = router;