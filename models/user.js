'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const crypto = require('crypto');
const maxResetPasswordTokenAge = 86400000 // 1 day

const ResetPasswordTokenSchema = new Schema({
    token: { type: String, required: true },
    expiration_date: {
        type: Date, required: true,
        default: new Date(new Date().getTime() + maxResetPasswordTokenAge)
    }
});

const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    reset_password_token: ResetPasswordTokenSchema
});

UserSchema.statics.hashToken = function (plainToken) {
    return crypto.createHash('sha256').update(plainToken).digest('hex');
};

UserSchema.statics.fetchUserByResetPasswordToken = function (email, token) {
    return this.findOne({
        'email': email,
        'reset_password_token.token': token,
        'reset_password_token.expiration_date': { $gt: new Date() }
    });
};

UserSchema.methods.clearResetPasswordToken = function () {
    return this.update({
        $unset: {
            reset_password_token: 1
        }
    });
};

UserSchema.methods.generateResetPasswordToken = function () {
    let plainToken = crypto.randomBytes(32).toString('hex');
    this.reset_password_token = {
        token: this.constructor.hashToken(plainToken),
    };
    return plainToken;
};

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);