'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const cryptoUtils = require('../utils/crypto');
const maxResetPasswordTokenAge = 1 * 24 * 60 * 60 * 1000 // 1 day

const ResetPasswordTokenSchema = new Schema({
    token: { type: String, required: true },
    expirationDate: { type: Date, required: true }
});

ResetPasswordTokenSchema.pre('validate', function (next) {
    if (!this.expirationDate) {
        this.expirationDate = new Date(new Date().getTime() + maxResetPasswordTokenAge);
    }
    next();
});

const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    resetPasswordToken: ResetPasswordTokenSchema,
});

UserSchema.virtual('rememberMeTokens', {
    ref: 'RememberMeToken', // The model to use
    localField: '_id',
    foreignField: 'user',
    justOne: false
});

UserSchema.statics.hashToken = function (plainToken) {
    return cryptoUtils.hashData(plainToken);
};

UserSchema.statics.fetchUserByResetPasswordToken = function (email, token) {
    return this.findOne({
        'email': email,
        'resetPasswordToken.token': token,
        'resetPasswordToken.expirationDate': { $gt: new Date() }
    });
};

UserSchema.methods.clearResetPasswordToken = function () {
    return this.update({
        $unset: { resetPasswordToken: 1 }
    });
};

UserSchema.methods.generateResetPasswordToken = function () {
    let plainToken = cryptoUtils.randomBytes(32);
    this.resetPasswordToken = {
        token: this.constructor.hashToken(plainToken),
    };
    return plainToken;
};

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);