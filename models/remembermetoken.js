'use strict';
const mongoose = require('mongoose');
const crypto = require("crypto");

//Define a schema
const Schema = mongoose.Schema;
var RememberMeTokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    timestamp: { type: Date, required: true, default: new Date() }
});

RememberMeTokenSchema.methods.generateToken = function generateToken(callback) {
    let self = this;
    let plainToken = crypto.randomBytes(32).toString('hex');
    let hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');
    this.model('RememberMeToken').count({ token: hashedToken }, function (count) {
        if (count > 0) {
            this.generateToken(callback);
        } else {
            self.token = hashedToken;
            callback(plainToken);
        }
    });
};

module.exports = mongoose.model('RememberMeToken', RememberMeTokenSchema);