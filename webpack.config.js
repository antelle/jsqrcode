'use strict';

var path = require('path'),
    webpack = require('webpack'),
    pkg = require('./package.json');

var debug = process.argv.indexOf('--debug') !== -1;

var plugins = [];

plugins.push(new webpack.optimize.OccurenceOrderPlugin());
if (!debug) {
    plugins.push(new webpack.optimize.UglifyJsPlugin({
        mangle: {},
        compress: {},
        output: { 'ascii_only': true }
    }));
}
plugins.push(new webpack.BannerPlugin('jsqrcode v' + pkg.version + ', (c) 2016 ' + pkg.author +
    ', fork of https://github.com/LazarSoft/jsqrcode, port of http://code.google.com/p/zxing' +
    ', http://opensource.org/licenses/' + pkg.license));

module.exports = {
    context: path.join(__dirname, './src'),
    entry: 'qrcode.js',
    output: {
        path: path.join(__dirname, './dist'),
        filename: debug ? 'qrcode.js' : 'qrcode.min.js',
        library: 'qrcode',
        libraryTarget: 'umd'
    },
    module: {
        loaders: [
            // { test: /\.js$/, loader: 'eslint-loader', exclude: /node_modules/ }
        ]
    },
    resolve: {
        root: [path.join(__dirname, './src')]
    },
    resolveLoader: {
        root: [path.join(__dirname, './node_modules')]
    },
    plugins: plugins,
    node: {
        console: false,
        process: false,
        Buffer: false,
        '__filename': false,
        '__dirname': false
    },
    eslint: {
        configFile: '.eslintrc',
        failOnError: true
    }
};
