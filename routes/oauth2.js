'use strict';

const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const oauth2Controller = require('../controllers/oauth2controller');

router.route('/authorize').get(authUtils.ensureLoggedIn, oauth2Controller.authorization)

router.route('/authorize').post(authUtils.ensureLoggedIn, oauth2Controller.decision);

router.route('/token').post(authUtils.ensureClientAuth, oauth2Controller.token);

module.exports = router;