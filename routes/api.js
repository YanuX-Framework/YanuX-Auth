'use strict';

const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const clientController = require('../controllers/apicontroller');


router.route('/verify_oauth2')
    .get(authUtils.ensureHttpAuthenticated,
        clientController.verifyOAuth2);

router.route('/token_info')
    .post(clientController.oauth2Introspection);

module.exports = router;