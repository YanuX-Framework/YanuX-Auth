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
};

exports.create_form = function (req, res, next) {
    res.render('client/form', {
        title: 'Client',
        user: req.user,
        error: req.flash('error'),
        action: "/client",
        client: new Client()
    });
};

exports.create = function (req, res, next) {
    new Client({
        name: req.body.name,
        id: req.body.id,
        secret: req.body.secret,
        redirectUri: req.body.redirectUri,
        user: req.user
    }).save().then(client => {
        res.format({
            'text/html': function () {
                res.redirect('/client');
            },
            'application/json': function () {
                res.json({
                    client: client,
                    message: "Client Successfully Created",
                    status: "success"
                });
            },
        });
    }).catch(err => next(err))
};

exports.retrieve = function (req, res, next) {
    Client.findOne({ _id: req.params.clientId, user: req.user }).then(client => {
        res.format({
            'text/html': function () {
                res.render('client/form', {
                    title: 'Client',
                    user: req.user,
                    error: req.flash('error'),
                    action: "/client/" + req.params.clientId + "?_method=PUT",
                    client: client
                });
            },
            'application/json': function () {
                res.json(client);
            },
        });
    }).catch(err => next(err));
};

exports.update = function (req, res, next) {
    Client.updateOne({ _id: req.params.clientId, user: req.user }, {
        name: req.body.name,
        id: req.body.id,
        secret: req.body.secret,
        redirectUri: req.body.redirectUri,
        user: req.user
    }, { runValidators: true }).then(result => {
        res.format({
            'text/html': function () {
                res.redirect('/client');
            },
            'application/json': function () {
                res.json({
                    result: result,
                    message: "Client Successfully Updated",
                    status: "success"
                });
            },
        });
    }).catch(err => next(err));
};

exports.delete = function (req, res, next) {
    Client.deleteOne({
        _id: req.params.clientId,
        user: req.user
    }).then(result => {
        res.format({
            'text/html': function () {
                res.redirect('/client');
            },
            'application/json': function () {
                res.json({
                    result: result,
                    message: "Client Successfully Deleted",
                    status: "success"
                });
            },
        });
    }).catch(err => next(err));
};