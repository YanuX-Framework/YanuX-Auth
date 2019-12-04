const CustomStrategy = require('passport-custom').Strategy;
const Client = require('../models/client');
const RefreshToken = require('../models/refreshtoken');

module.exports = new CustomStrategy(function (req, callback) {
    const grant_type = req.body.grant_type || req.headers.grant_type;
    const client_id = req.body.client_id || req.headers.client_id;
    const refresh_token = req.body.refresh_token || req.headers.refresh_token;
    if (grant_type === 'refresh_token' && client_id && refresh_token) {
        Client.findOne({
            id: client_id,
        }).then(client => {
            return RefreshToken.findOne({
                token: RefreshToken.hashToken(refresh_token),
                client: client,
                expirationDate: { $gt: new Date() }
            })
        }).then(refToken => {
            if (refToken) { callback(null, refToken.client); }
            else { callback(null, false); }
        }).catch(err => { callback(err, false); })
    } else { callback(null, false); }
})