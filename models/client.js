'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// TODO: I should consider auto generating the client id and secret in order to enforce uniqueness, randomness, and strength.
const ClientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    id: { type: String,  unique: true, required: true },
    // TODO: Perhaps I should hash the secret.
    secret: { type: String, required: false },
    // TODO: Should the redirect_uri be ALWAYS required?
    redirectUri: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

// Export the Mongoose model
module.exports = mongoose.model('Client', ClientSchema);
