'use strict';

const mongoose = require('mongoose');
const cryptoUtils = require('../utils/crypto');
const Schema = mongoose.Schema;
const maxRefreshTokenAge = 365 * 24 * 60 * 60 * 1000 // 1 year;
const uidLength = 256;

const RefreshTokenSchema = new mongoose.Schema({
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accessToken: { type: Schema.Types.ObjectId, ref: 'AccessToken', required: true },
    // TODO: Perhaps I should hash the token.
    token: { type: String, required: true },
    scope: { type: String, required: false },
    expirationDate: { type: Date, required: true }
});

RefreshTokenSchema.statics.tokenUid = function () {
    return cryptoUtils.generateUid(uidLength);
};

RefreshTokenSchema.statics.hashToken = function (plainToken) {
    return cryptoUtils.hashData(plainToken);
};

RefreshTokenSchema.virtual('tokenHash').set(function (plainToken) {
    this.token = this.constructor.hashToken(plainToken);
});

RefreshTokenSchema.pre('validate', function (next) {
    if (!this.expirationDate) {
        this.expirationDate = new Date(new Date().getTime() + maxRefreshTokenAge);
    } next();
});

// Export the Mongoose model
module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);