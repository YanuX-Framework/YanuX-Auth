'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { exportJWK, calculateJwkThumbprint } = require('jose');

// Normalize a port into a number, string, or false.
const normalizePort = val => {
    const port = parseInt(val, 10);
    if (isNaN(port)) { return val; }
    if (port >= 0) { return port; }
    return false;
}

// Reading the config into memory.
const config = {}
try { Object.assign(config, JSON.parse(fs.readFileSync(path.normalize('config.json'), 'utf8'))) }
catch (e) { console.error('Couldn\'t load a config file. Trying to load a working configuration from environment variables alone.') }

// Config Name
config.name = process.env.NAME || config.name;

// Config Port
config.port = normalizePort(process.env.PORT || config.port);

// Config Log Level
config.log_level = process.env.LOG_LEVEL || config.log_level || 'debug';

// Config Database
config.mongodb_uri = process.env.MONGODB_URI || config.mongodb_uri;

// Config ZeroConf
config.zeroconf = process.env.ZEROCONF === 'true' || config.zeroconf;

// Config Email
config.email = config.email || {};
config.email.from = process.env.EMAIL_FROM || config.email.from;
config.email.host = process.env.EMAIL_HOST || config.email.host;
config.email.port = parseInt(process.env.EMAIL_PORT) || config.email.port;
config.email.security = process.env.EMAIL_SECURITY || config.email.security;
config.email.username = process.env.EMAIL_USERNAME || config.email.username;
config.email.password = process.env.EMAIL_PASSWORD || config.email.password;

// Config Keys
config.keys = config.keys || {};
config.keys.private_key_pem = process.env.KEYS_PRIVATE_KEY ? process.env.KEYS_PRIVATE_KEY : fs.readFileSync(path.normalize(config.keys.private_key_path), 'utf8');
config.keys.public_key_pem = process.env.KEYS_PUBLIC_KEY ? process.env.KEYS_PUBLIC_KEY : fs.readFileSync(path.normalize(config.keys.public_key_path), 'utf8');

config.keys.private_key = crypto.createPrivateKey(config.keys.private_key_pem);
config.keys.public_key = crypto.createPublicKey(config.keys.public_key_pem);

Promise.all([
    exportJWK(config.keys.private_key),
    exportJWK(config.keys.public_key)
]).then(keys => {
    config.keys.private_jwk = keys[0];
    config.keys.public_jwk = keys[1];
    return Promise.all([
        calculateJwkThumbprint(config.keys.private_jwk),
        calculateJwkThumbprint(config.keys.public_jwk)
    ])
}).then(tps => {
    config.keys.private_jwk.kid = tps[0];
    config.keys.public_jwk.kid = tps[1];
    console.log('Loaded Private and Public Keys');
}).catch(e => console.error('Error while loading Private and Public Keys:', e));

//Config Cookie Secret
config.name = process.env.COOKIE_SECRET || config.cookie_secret;

//Config Remember Me Token Expires In
config.remember_me_token_expires_in = parseInt(process.env.REMEMBER_ME_TOKEN_EXPIRES_IN) || config.remember_me_token_expires_in;

// Config OAuth2
config.oauth2 = config.oauth2 || {};
config.oauth2.authorization_code_expires_in = parseInt(process.env.OAUTH2_AUTHORIZATION_CODE_EXPIRES_IN) || config.oauth2.authorization_code_expires_in;
config.oauth2.access_token_expires_in = parseInt(process.env.OAUTH2_ACCESS_TOKEN_EXPIRES_IN) || config.oauth2.access_token_expires_in;
config.oauth2.refresh_token_expires_in = parseInt(process.env.OAUTH2_REFRESH_TOKEN_EXPIRES_IN) || config.oauth2.refresh_token_expires_in;
config.oauth2.resource_server_credentials = process.env.OAUTH2_RESOURCE_SERVER_CREDENTIALS ? JSON.parse(process.env.OAUTH2_RESOURCE_SERVER_CREDENTIALS) : config.oauth2.resource_server_credentials || [];

// Config OpenID Connect
config.open_id_connect = config.open_id_connect || {};
//NOTE: 
//I'm also using this 'open_id_connect.iss' as the config that represents the URL where the website can be reached.
//Perhaps I should create a dedicated config for that, or change the name of this one to something more generic.
config.open_id_connect.iss = process.env.OPEN_ID_CONNECT_ISS || config.open_id_connect.iss;
config.open_id_connect.expires_in = parseInt(process.env.OPEN_ID_CONNECT_EXPIRES_IN) || config.open_id_connect.expires_in;

module.exports = app => {
    if (app) { app.set('config', config); }
    return config;
}