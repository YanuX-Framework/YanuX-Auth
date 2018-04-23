'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const maxAccessTokenAge = 30 * 24 * 60 * 60 * 1000 // 30 days;
const maxRefreshTokenAge = 365 * 24 * 60 * 60 * 1000 // 1 year;

const RefreshTokenSchema = new Schema({
    token: { type: String, required: true },
    expirationDate: { type: Date, required: true }
});

const AccessTokenSchema = new mongoose.Schema({
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // TODO: Perhaps I should hash the token.
    token: { type: String, required: true },
    // TODO: Should I include a timestamp to check for the token validity?
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