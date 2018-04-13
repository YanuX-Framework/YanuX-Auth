'use strict';

const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const clientController = require('../controllers/apicontroller');

router.route('/client')
    .get(authUtils.ensureHttpBasicAuth,
        clientController.getClient);

router.route('/client')
    .post(authUtils.ensureHttpBasicAuth,
        clientController.postClient);

router.route('/verify_oauth2')
    .get(authUtils.ensureHttpAuthenticated,
        clientController.verifyOAuth2);

module.exports = router;