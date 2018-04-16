'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const maxAccessTokenAge = 30 * 24 * 60 * 60 * 1000 // 30 days;

var AccessTokenSchema = new mongoose.Schema({
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // TODO: Perhaps I should hash the value.
    value: { type: String, required: true },
    // TODO: Should I include a timestamp to check for the token validity?
    expiration_date: { type: Date, required: true }
});

AccessTokenSchema.statics.MAX_ACCESS_TOKEN_AGE = maxAccessTokenAge;

AccessTokenSchema.pre('validate', function (next) {
    if (!this.expiration_date) {
        this.expiration_date = new Date(new Date().getTime() + maxAccessTokenAge);
    }
    next();
});

// Export the Mongoose model
module.exports = mongoose.model('AccessToken', AccessTokenSchema);
