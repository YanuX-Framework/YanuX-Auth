'use strict';

const HttpBasicStrategy = require('passport-http').BasicStrategy;
const Client = require('../models/client');

module.exports = new HttpBasicStrategy((username, password, callback) => {
    Client.findOne({ id: username }).then(client => {
        if (client && client.secret === password) {
            return callback(null, client);
        } else {
            return callback(null, false);
        }
    }).catch(err => callback(err));
});