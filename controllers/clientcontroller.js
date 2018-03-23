// Load required packages
var Client = require('../models/client');

// Create endpoint /api/client for POST
exports.postClients = function (req, res, next) {
    // Create a new instance of the Client model
    var client = new Client();
    // Set the client properties that came from the POST data
    client.name = req.body.name;
    client.id = req.body.id;
    client.secret = req.body.secret;
    client.user = req.user._id;
    // Save the client and check for errors
    client.save()
        .then(() => res.json({ message: 'Client added', data: client }))
        .catch(err => res.send(err));
};

// Create endpoint /api/clients for GET
exports.getClients = function (req, res, next) {
    // Use the Client model to find all clients
    Client.find({ user: req.user })
        .then(clients => res.json(clients))
        .catch(err => res.send(err));
};