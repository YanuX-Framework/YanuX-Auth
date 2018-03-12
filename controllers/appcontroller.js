'use strict';
exports.index = function (req, res, next) {
    res.render('index', {
        title: 'Home',
        user: req.user
    });
};

exports.emailtest = function (req, res, next) {
    req.app.locals.email.send({
        template: 'generic',
        message: {
            to: 'petersaints@gmail.com'
        },
        locals: {
            subject: 'Email Test',
            body: 'Email Test'
        }
    }).then(console.log).catch(console.error);
    res.send('Email Test');
};