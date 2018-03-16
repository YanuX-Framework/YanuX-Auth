'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const crypto = require('crypto');

var UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String },
    reset_password_token: { type: String }
});

UserSchema.methods.generateResetPasswordToken = function() {
    let plainToken = crypto.randomBytes(32).toString('hex');
    let hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    
    this.reset_password_token = hashedToken;
    return plainToken;
};

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);