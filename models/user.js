'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const crypto = require('crypto');

const maxResetPasswordTokenAge = 86400000 // 1 day

var UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    reset_password_token: {
        token: { type: String },
        timestamp: { type: Date, required: true }
    }
});

UserSchema.statics.hashToken = function (plainToken) {
    return crypto.createHash('sha256').update(plainToken).digest('hex');
};

UserSchema.statics.fetchUserByResetPasswordToken = function (email, token) {
    let now = new Date().getTime();
    let maxAgeDate = new Date(now - maxResetPasswordTokenAge);
    return this.findOne({
        'email': email,
        'reset_password_token.token': token,
        'reset_password_token.timestamp': { $gt: maxAgeDate }
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
        timestamp: new Date()
    };
    return plainToken;
};

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);