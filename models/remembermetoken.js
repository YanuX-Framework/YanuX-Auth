var mongoose = require('mongoose');
var crypto = require("crypto");

//Define a schema
var Schema = mongoose.Schema;

var RememberMeTokenSchema = new Schema({
    userId: String,
    token: { type: String, default: crypto.randomBytes(32).toString('hex') }
});

module.exports = mongoose.model('RememberMeToken', RememberMeTokenSchema );