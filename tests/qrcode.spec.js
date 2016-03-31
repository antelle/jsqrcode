'use strict';

var expect = require('expect.js');

var QrCode = require('qr-code');

describe('QrCode', function() {
    it('Parses hello QrCode', function(done) {
        testCode('hello', 'Hello :)', done);
    });

    it('Parses photo QrCode', function(done) {
        testCode('photo', 'http://www.linkedin.com/in/hannahwatanabe', done);
    });

    it('Parses poster QrCode', function(done) {
        testCode('poster', 'http://qr2.it/Go/24356', done);
    });

    it('Parses blurry QrCode', function(done) {
        testCode('blurry', 'http://bob.plushms.mobi/doc', done);
    });

    it('Parses perspective QrCode', function(done) {
        testCode('perspective', 'http://goo.by/wp5PRT/property-partners-maxwell-heaslip-leonard', done);
    });

    it('Parses distorted QrCode', function(done) {
        testCode('distorted', 'http://wap.pepsi.co.uk/m5', done);
    });

    it('Parses screenshot QrCode', function(done) {
        testCode('screenshot', 'http://goQR.me', done);
    });

    it('Parses options QrCode', function(done) {
        testCode('options.png', 'http://example.com', done);
    });

    it('Parses totp1 QrCode', function(done) {
        testCode('totp1.png', 'otpauth://totp/erik?period=30&digits=6&secret=2233445566777733', done);
    });

    it('Parses totp2 QrCode', function(done) {
        testCode('totp2.png', 'otpauth://totp/$LABEL?secret=$SECRET', done);
    });

    it('Parses totp3 QrCode', function(done) {
        testCode('totp3.png', 'otpauth://totp/erik?secret=2233445566777733&period=30&digits=6', done);
    });

    it('Parses totp-github QrCode', function(done) {
        testCode('totp-github.png', 'otpauth://totp/github.com/NewSecureCat?issuer=GitHub&secret=7xqddgdjxkmpju4f', done);
    });

    function testCode(imgName, exp, done) {
        var img = new Image();
        img.src = 'img/' + imgName + (imgName.indexOf('.') < 0 ? '.jpg' : '');
        img.onload = function() {
            var qr = new QrCode(img);
            var res = qr.decode();
            expect(res).to.eql(exp);
            done();
        };
    }
});
