'use strict';

const mongoose = require('mongoose');
const crypto = require('crypto');
const Schema = mongoose.Schema;
const maxRememberMeTokenAge = 30 * 24 * 60 * 60 * 1000 // 30 days

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

RememberMeTokenSchema.statics.hashToken = function (token) {
    return crypto.createHash('sha256').update(token).digest('hex');
};

RememberMeTokenSchema.methods.generateToken = function () {
    let self = this;
    let plainToken = crypto.randomBytes(32).toString('hex');
    let hashedToken = this.constructor.hashToken(plainToken);

    return new Promise(function (resolve, reject) {
        self.model('RememberMeToken').count({
            user: self.user,
            token: hashedToken,
            expirationDate: { $gt: new Date() }
        }).then(count => {
            if (count > 0) {
                resolve(self.generateToken());
            } else {
                self.token = hashedToken;
                resolve(plainToken);
            }
        }).catch(err => reject(err));
    });
};

module.exports = mongoose.model('RememberMeToken', RememberMeTokenSchema);