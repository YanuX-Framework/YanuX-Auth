'use strict';

const mongoose = require('mongoose');
const cryptoUtils = require('../utils/crypto');
const Schema = mongoose.Schema;
const maxRememberMeTokenAge = require('../config.json').authentication.remember_me_token_expires_in;

const RememberMeTokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expirationDate: { type: Date, required: true }
});

RememberMeTokenSchema.statics.MAX_REMEMBER_ME_TOKEN_AGE = maxRememberMeTokenAge;

RememberMeTokenSchema.pre('validate', function (next) {
    if (!this.expirationDate) {
        this.expirationDate = new Date(new Date().getTime() + maxRememberMeTokenAge);
    }
    next();
});

RememberMeTokenSchema.statics.hashToken = function (plainToken) {
    return cryptoUtils.hashData(plainToken);
};

RememberMeTokenSchema.methods.generateToken = function () {
    let self = this;
    let plainToken = cryptoUtils.randomBytes(32);
    this.token = this.constructor.hashToken(plainToken);
    return plainToken;
};

module.exports = mongoose.model('RememberMeToken', RememberMeTokenSchema);