'use strict';

const express = require('express');
const router = express.Router();
const oauth2Controller = require('../controllers/oauth2');
const authUtils = require('../utils/auth');

router.route('/authorize')
    .get(authUtils.ensureAuthenticated,
        oauth2Controller.authorization)
router.route('/authorize')
    .post(authUtils.ensureAuthenticated,
        oauth2Controller.decision);

router.route('/token')
    .post(authUtils.ensureClientHttpBasicAuth,
        oauth2Controller.token);
