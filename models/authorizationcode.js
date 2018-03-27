'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var AuthorizationCodeSchema = new mongoose.Schema({
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // TODO: Perhaps I should hash the value.
    value: { type: String, required: true },
    redirectUri: { type: String, required: true }
    // TODO: Should I include a timestamp to check for the code validity?
});

// Export the Mongoose model
module.exports = mongoose.model('AuthorizationCode', AuthorizationCodeSchema);
