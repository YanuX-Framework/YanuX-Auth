'use strict';

const Client = require('../models/client');

exports.index = function (req, res, next) {
    Client.find({ user: req.user }).then(clients => {
        res.format({
            'text/html': function () {
                res.render('client/index', {
                    title: 'Clients',
                    user: req.user,
                    error: req.flash('error'),
                    clients: clients
                });
            },
            'application/json': function () {
                res.json(clients);
            },
        });
    }).catch(err => next(err));
}

exports.show = function (req, res, next) {
    Client.findOne({
        _id: req.params.clientId,
        user: req.user
    }).then(client => {
        res.format({
            'text/html': function () {
                res.render('client/show', {
                    title: 'Client',
                    user: req.user,
                    error: req.flash('error'),
                    client: client
                });
            },
            'application/json': function () {
                res.json(client);
            },
        });
    }).catch(err => next(err));
}

exports.delete = function (req, res, next) {
    Client.deleteOne({
        _id: req.params.clientId,
        user: req.user
    }).then(result => {
        res.redirect('/client');
    }).catch(err => next(err));
}