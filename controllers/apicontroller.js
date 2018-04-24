'use strict';

// TODO: Create full RESTful API and/or pages to manage clients.
const Client = require('../models/client');

// Create endpoint /api/client for POST
exports.postClient = function (req, res, next) {
    // Create a new instance of the Client model
    var client = new Client();
    // Set the client properties that came from the POST data
    client.name = req.body.name;
    client.id = req.body.id;
    client.secret = req.body.secret;
    client.redirectUri = req.body.redirect_uri;
    client.user = req.user._id;
    // Save the client and check for errors
    client.save()
        .then(() => res.json({ message: 'Client added', data: client }))
        .catch(err => res.send(err));
};

// Create endpoint /api/client for GET
exports.getClient = function (req, res, next) {
    // Use the Client model to find all clients
    Client.find({ user: req.user })
        .then(clients => res.json(clients))
        .catch(err => res.send(err));
};

exports.verifyOAuth2 = function (req, res, next) {
    res.json({ user: req.user });
}
