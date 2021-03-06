# jsqrcode [![Build status](https://travis-ci.org/antelle/jsqrcode.svg?branch=master)](https://travis-ci.org/antelle/jsqrcode)

Yet another fork of jsqrcode for browser.

This is a fork of Lazar Laszlo's QRCode reader built with webpack. The original project is abandoned,
  and other forks didn't work for me well.

JavaScript QRCode reader for HTML5 enabled browser.  
Fork of jsqrcode by [Lazar Laszlo](http://lazarsoft.info): https://github.com/LazarSoft/jsqrcode  
Which is a port of ZXing qrcode scanner: https://github.com/zxing/zxing.

# Changes

In this fork:

- object-oriented modular API
- no global variables or monkey patching
- ESLint-ed code
- built with webpack, ready to use as module
- minified and debug builds
- 40kB total, no dependencies
- mocha tests

# Usage

```javascript
var img = new Image();
img.src = 'qr.jpg';
img.onload = function() {
    var qr = new QrCode(img);
    var decodedText = qr.decode();
};
```

# License

Apache 2.0
