'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const maxRefreshTokenAge = 365 * 24 * 60 * 60 * 1000 // 1 year;

const RefreshTokenSchema = new mongoose.Schema({
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: Schema.Types.ObjectId, ref: 'AccessToken', required: true },
    // TODO: Perhaps I should hash the token.
    token: { type: String, required: true },
    expirationDate: { type: Date, required: true }
});

RefreshTokenSchema.statics.MAX_REFRESH_TOKEN_AGE = maxRefreshTokenAge;

RefreshTokenSchema.pre('validate', function (next) {
    if (!this.expirationDate) {
        this.expirationDate = new Date(new Date().getTime() + maxRefreshTokenAge);
    }
    next();
});

// Export the Mongoose model
module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);