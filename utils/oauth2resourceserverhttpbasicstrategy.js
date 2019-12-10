'use strict';

const HttpBasicStrategy = require('passport-http').BasicStrategy;
const resourceServerCredentials = require('../config.json').oauth2.resource_server_credentials

module.exports = new HttpBasicStrategy((username, password, callback) => {
    if (!resourceServerCredentials.some(rsc => {
        if (rsc.client_id === username && rsc.client_secret === password) {
            callback(null, rsc)
            return true;
        }
        return false;
    })) { callback(null, false); }
});