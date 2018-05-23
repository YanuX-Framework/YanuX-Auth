'use strict';

const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const clientController = require('../controllers/apicontroller');

router.route('/verify_oauth2')
    .get(authUtils.ensureHttpAuthenticated,
        clientController.verifyOAuth2);

module.exports = router;