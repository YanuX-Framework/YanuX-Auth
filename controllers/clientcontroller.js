'use strict';

const Client = require('../models/client');

exports.index = function(req, res, next) {
    Client.find({user: req.user}).then(clients => {
        res.render('client/index', {
            title: 'Clients',
            user: req.user,
            error: req.flash('error'),
            clients: clients
        });
    }); 
}