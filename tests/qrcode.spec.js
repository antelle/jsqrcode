'use strict';

var expect = require('expect.js');

var QrCode = require('qr-code');

describe('QrCode', function() {
    it('parses QrCode', function(done) {
        var img = new Image();
        img.src = 'img/qr1.jpg';
        img.onload = function() {
            var qr = new QrCode(img);
            var res = qr.decode();
            expect(res).to.eql('Hello :)');
            done();
        };
    });
});
