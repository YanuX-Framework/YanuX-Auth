'use strict';

const crypto = require('crypto');
const uid = require('uid2');
const hashAlgorithm = 'sha512';
const digestAlgorithm = 'base64';

module.exports.randomBytes = function (numBytes) {
    return crypto.randomBytes(numBytes).toString(digestAlgorithm);
};

module.exports.generateUid = function (length) {
    return uid(length);
};

module.exports.hashData = function (data) {
    return crypto.createHash(hashAlgorithm).update(data).digest(digestAlgorithm);
};