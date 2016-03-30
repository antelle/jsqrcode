'use strict';

var path = require('path'),
    walk = require('fs-walk');

var entry = [];

walk.walkSync(__dirname, function (basedir, filename, stat) {
    if (stat.isFile() && path.extname(filename) === '.js' && filename.indexOf('spec') > 0) {
        entry.push(path.join(basedir, filename));
    }
});

module.exports = {
    context: path.join(__dirname, './'),
    entry: entry,
    output: {
        path: path.join(__dirname, 'build'),
        filename: 'qrcode.test.js',
        libraryTarget: 'umd'
    },
    module: {
        loaders: [
            { test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules|src/ }
        ]
    },
    resolve: {
        root: [path.join(__dirname, '../src')]
    },
    resolveLoader: {
        root: [path.join(__dirname, '../node_modules')]
    },
    node: {
        console: false,
        process: false,
        Buffer: false,
        '__filename': false,
        '__dirname': false
    },
    externals: {
        fs: true,
        path: true
    },
    eslint: {
        failOnError: true
    }
};
