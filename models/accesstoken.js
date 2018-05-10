'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const maxAccessTokenAge = 30 * 24 * 60 * 60 * 1000 // 30 days;

const AccessTokenSchema = new mongoose.Schema({
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    // TODO: Perhaps I should hash the token.
    token: { type: String, required: true },
    scope: { type: String, required: false },
    expirationDate: { type: Date, required: true }
});

AccessTokenSchema.statics.MAX_ACCESS_TOKEN_AGE = maxAccessTokenAge;

AccessTokenSchema.pre('validate', function (next) {
    if (!this.expirationDate) {
        this.expirationDate = new Date(new Date().getTime() + maxAccessTokenAge);
    }
    next();
});

// Export the Mongoose model
module.exports = mongoose.model('AccessToken', AccessTokenSchema);