'use strict';

const configure = require('../configure');
const config = configure();
const resourceServerCredentials = config.oauth2.resource_server_credentials

const HttpBasicStrategy = require('passport-http').BasicStrategy;

module.exports = new HttpBasicStrategy((username, password, callback) => {
    if (!resourceServerCredentials.some(rsc => {
        if (rsc.client_id === username && rsc.client_secret === password) {
            callback(null, rsc)
            return true;
        }
        return false;
    })) { callback(null, false); }
});