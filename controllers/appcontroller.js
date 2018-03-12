'use strict';
exports.index = function (req, res, next) {
    res.render('index', {
        title: 'Home',
        user: req.user
    });
};

exports.email_test = function (req, res, next) {
    req.app.locals.email.send({
        template: 'passwordreset',
        message: {
            to: 'petersaints@gmail.com'
        },
        locals: {
            content: 'New Random Password'
        }
    }).then(console.log).catch(console.error);
    res.send('Email Test Sent');
};