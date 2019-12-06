'use strict';

const mongoose = require('mongoose');
const cryptoUtils = require('../utils/crypto');
const Schema = mongoose.Schema;
const maxAuthorizationCodeAge = require('../config.json').oauth2.authorization_code_expires_in;
const uidLength = 16;

var AuthorizationCodeSchema = new mongoose.Schema({
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    redirectUri: { type: String, required: true },
    scope: { type: [String], default: [] },
    codeChallenge: { type: String, required: false },
    codeChallengeMethod: { type: String, required: false },
    expirationDate: { type: Date, required: true }
});

AuthorizationCodeSchema.statics.codeUid = function () {
    return cryptoUtils.generateUid(uidLength);
};

AuthorizationCodeSchema.statics.hashCode = function (plainCode) {
    return cryptoUtils.hashData(plainCode);
};

AuthorizationCodeSchema.virtual('codeHash').set(function (plainCode) {
    this.code = this.constructor.hashCode(plainCode);
});

AuthorizationCodeSchema.pre('validate', function (next) {
    if (!this.expirationDate) {
        this.expirationDate = new Date(new Date().getTime() + maxAuthorizationCodeAge);
    }
    if (this.codeChallenge && !this.codeChallengeMethod) {
        this.codeChallengeMethod = 'plain';
    }
    next();
});

// Export the Mongoose model
module.exports = mongoose.model('AuthorizationCode', AuthorizationCodeSchema);
