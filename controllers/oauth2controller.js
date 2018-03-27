'use strict';

const oauth2orize = require('oauth2orize')
const User = require('../models/user');
const Client = require('../models/client');
const AccessToken = require('../models/accesstoken');
const AuthorizationCode = require('../models/authorizationcode');

function uid(len) {
    var buf = []
        , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        , charlen = chars.length;

    for (var i = 0; i < len; ++i) {
        buf.push(chars[getRandomInt(0, charlen - 1)]);
    }

    return buf.join('');
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const oauth2_server = oauth2orize.createServer();

oauth2_server.serializeClient(function (client, callback) {
    return callback(null, client._id);
});

oauth2_server.deserializeClient(function (id, callback) {
    Client.findOne({ _id: id })
        .then(client => callback(null, client))
        .catch(err => callback(err))
});

server.grant(oauth2orize.grant.code(function (client, redirectUri, user, ares, callback) {
    // Create a new authorization code
    var code = new AuthorizationCode({
        client: client._id,
        user: user._id,
        value: uid(16),
        redirectUri: redirectUri
    });

    code.save(function (err) {
        if (err) { return callback(err); }

        callback(null, code.value);
    });
}));

oauth2_server.exchange(oauth2orize.exchange.code(function (client, code, redirectUri, callback) {
    AuthorizationCode.findOne({ value: code }, function (err, authCode) {
        if (err) { return callback(err); }
        if (authCode === undefined) { return callback(null, false); }
        if (client._id.toString() !== authCode.client._id) { return callback(null, false); }
        if (redirectUri !== authCode.redirectUri) { return callback(null, false); }

        // Delete auth code now that it has been used
        authCode.remove(function (err) {
            if (err) {
                return callback(err);
            }

            // Create a new access token
            var token = new AccessToken({
                value: uid(256),
                client: authCode.client._id,
                user: authCode.user._id
            });

            // Save the access token and check for errors
            token.save(function (err) {
                if (err) { return callback(err); }
                callback(null, token);
            });
        });
    });
}));

module.exports.authorization = [
    oauth2_server.authorization(function (clientId, redirectUri, callback) {
        Client.findOne({ id: clientId }, function (err, client) {
            if (err) { return callback(err); }

            return callback(null, client, redirectUri);
        });
    }),
    function (req, res) {
        res.render('dialog', { transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client });
    }
]

module.exports.decision = [
    oauth2_server.decision()
]

module.exports.token = [
    oauth2_server.token(),
    oauth2_server.errorHandler()
]