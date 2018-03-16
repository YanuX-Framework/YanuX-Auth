'use strict';
const mongoose = require('mongoose');
const crypto = require('crypto');

//Define a schema
const Schema = mongoose.Schema;
var RememberMeTokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    timestamp: { type: Date, required: true, default: new Date() }
});

RememberMeTokenSchema.methods.generateToken = function() {
    let self = this;
    let plainToken = crypto.randomBytes(32).toString('hex');
    let hashedToken = crypto.createHash('sha256').update(plainToken).digest('hex');

    return new Promise(function (resolve, reject) {
        self.model('RememberMeToken').count({ token: hashedToken }).then((count) => {
            if (count > 0) {
                this.generateToken();
            } else {
                self.token = hashedToken;
                resolve(plainToken);
            }
        }).catch((err) => reject(err));
    });
};

module.exports = mongoose.model('RememberMeToken', RememberMeTokenSchema);