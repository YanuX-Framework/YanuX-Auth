'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const maxAuthorizationCodeAge = 1 * 24 * 60 * 60 * 1000 // 1 day;

var AuthorizationCodeSchema = new mongoose.Schema({
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // TODO: Perhaps I should hash the value.
    value: { type: String, required: true },
    redirectUri: { type: String, required: true },
    // TODO: Should I include a timestamp to check for the code validity?
    expiration_date: { type: Date, required: true }
});

AuthorizationCodeSchema.statics.MAX_AUTHORIZATION_CODE_AGE = maxAuthorizationCodeAge;

AuthorizationCodeSchema.pre('validate', function (next) {
    if (!this.expiration_date) {
        this.expiration_date = new Date(new Date().getTime() + maxAuthorizationCodeAge);
    }
    next();
});

AuthorizationCodeSchema.pre('save', function (next) {
    this.expiration_date = new Date(new Date().getTime() + maxAuthorizationCodeAge);
    next();
});

// Export the Mongoose model
module.exports = mongoose.model('AuthorizationCode', AuthorizationCodeSchema);
