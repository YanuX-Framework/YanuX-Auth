'use strict';

const express = require('express');
const router = express.Router();
const authUtils = require('../utils/auth');
const clientController = require('../controllers/clientcontroller')

router.get('/',
    authUtils.ensureLoggedIn,
    clientController.index);

router.get('/new',
    authUtils.ensureLoggedIn,
    clientController.create_form);

router.post('/',
    authUtils.ensureLoggedIn,
    clientController.create);

router.get('/:clientId',
    authUtils.ensureLoggedIn,
    clientController.retrieve);

router.put('/:clientId',
    authUtils.ensureLoggedIn,
    clientController.update);

router.delete('/:clientId',
    authUtils.ensureLoggedIn,
    clientController.delete);

module.exports = router;