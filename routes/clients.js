'use strict';
const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const clientController = require('../controllers/clientcontroller');

router.route('/clients')
    .get(authUtils.ensureHttpBasicAuth,
        clientController.getClients);

router.route('/clients')
    .post(authUtils.ensureHttpBasicAuth,
        clientController.postClients);

module.exports = router;