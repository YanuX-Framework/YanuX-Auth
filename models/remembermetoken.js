'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');

const Schema = mongoose.Schema;
const RememberMeTokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    timestamp: { type: Date, required: true, default: new Date() }
});

RememberMeTokenSchema.statics.hashToken = function (token) {
    return crypto.createHash('sha256').update(token).digest('hex');
};

RememberMeTokenSchema.methods.generateToken = function () {
    let self = this;
    let plainToken = crypto.randomBytes(32).toString('hex');
    let hashedToken = this.constructor.hashToken(plainToken);

    return new Promise(function (resolve, reject) {
        self.model('RememberMeToken').count({ token: hashedToken }).then(count => {
            // TODO: Not sure if I want/need to enforce uniqueness by recursevely generating a random token.
            if (count > 0) {
                this.generateToken();
            } else {
                self.token = hashedToken;
                resolve(plainToken);
            }
        }).catch(err => reject(err));
    });
};

module.exports = mongoose.model('RememberMeToken', RememberMeTokenSchema);