'use strict';

const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const apiController = require('../controllers/apicontroller');

//Custom "Token Introspection Endpoint"
router.route('/verify_oauth2').get(authUtils.ensureHttpAuthenticated, apiController.verifyOAuth2);

//A more standard "Token Introspection Endpoint"
router.route('/token_info').post(apiController.oauth2Introspection);

//Serving the server's public key
router.route('/public_key').get(apiController.publicKey);

//Serving the server's JWKs
router.route('/jwks').get(apiController.jwks);

module.exports = router;