'use strict';

const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const Client = require('../models/client');

module.exports = new ClientPasswordStrategy(function (clientId, clientSecret, callback) {
    Client.findOne({ id: clientId }).then(client => {
        if (client && client.secret === clientSecret) {
            return callback(null, client);
        } else {
            return callback(null, false);
        }
    }).catch(err => callback(err));
});