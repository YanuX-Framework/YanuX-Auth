'use strict';

const dnssd = require('dnssd');

module.exports = function (app) {
    const ad = new dnssd.Advertisement(dnssd.tcp('http'), app.get('port'), { name: app.get('config').name, txt: { protocol: 'http' }});
    ad.start();
}