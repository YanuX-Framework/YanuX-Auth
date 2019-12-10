'use strict';

const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const clientController = require('../controllers/apicontroller');

//Custom "Token Introspection Endpoint"
router.route('/verify_oauth2').get(authUtils.ensureHttpAuthenticated, clientController.verifyOAuth2);

//A more standard "Token Introspection Endpoint"
router.route('/token_info').post(clientController.oauth2Introspection);

//Custom "Token Introspection Endpoint"
router.route('/public_key').get(clientController.publicKey);

module.exports = router;