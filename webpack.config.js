var path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './public/javascripts/src/index.js',
    output: {
        path: path.resolve(__dirname, 'public', 'javascripts', 'dist'),
        filename: 'bundle.js'
    }
};