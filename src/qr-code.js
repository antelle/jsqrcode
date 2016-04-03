/*
 Copyright 2011 Lazar Laszlo (lazarsoft@gmail.com, www.lazarsoft.info)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

var Detector = require('./detector');
var Decoder = require('./decoder');
var PureBitsExtractor = require('./pure-bits-extractor');


function QrCode(image) {
    var MaxImgSize = 1024 * 1024;

    var canvas;
    var context;
    var width;
    var height;
    var imageData;

    this.decode = function() {
        canvas = document.createElement('canvas');
        context = canvas.getContext('2d');
        var nheight = image.height;
        var nwidth = image.width;
        if (image.width * image.height > MaxImgSize) {
            var ir = image.width / image.height;
            nheight = Math.sqrt(MaxImgSize / ir);
            nwidth = ir * nheight;
        }

        canvas.width = nwidth;
        canvas.height = nheight;

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        width = canvas.width;
        height = canvas.height;
        imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        return process();
    };

    function process() {
        var bitmap = grayScaleToBitmap(grayscale());

        bitmap.width = width;
        bitmap.height = height;
        bitmap.imagedata = imageData;

        var reader;
        try {
            var bits = PureBitsExtractor.extractPureBits(bitmap);
            reader = Decoder.decode(bits);
        } catch (e) {
            var detector = new Detector(bitmap);
            var qRCodeMatrix = detector.detect();
            reader = Decoder.decode(qRCodeMatrix.bits);
        }

        var data = reader.getDataByte();
        var str = '';
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].length; j++) {
                str += String.fromCharCode(data[i][j]);
            }
        }

        return str;
    }

    function getMiddleBrightnessPerArea(data) {
        var numSqrtArea = 4;
        // obtain middle brightness((min + max) / 2) per area
        var areaWidth = Math.floor(width / numSqrtArea);
        var areaHeight = Math.floor(height / numSqrtArea);
        var minmax = new Array(numSqrtArea);
        for (var i = 0; i < numSqrtArea; i++) {
            minmax[i] = new Array(numSqrtArea);
            for (var i2 = 0; i2 < numSqrtArea; i2++) {
                minmax[i][i2] = [0, 0];
            }
        }
        var ax, ay;
        for (ay = 0; ay < numSqrtArea; ay++) {
            for (ax = 0; ax < numSqrtArea; ax++) {
                var min = 0;
                var max = 0xFF;
                for (var dy = 0; dy < areaHeight; dy++) {
                    var baseCoord = areaWidth * ax + (areaHeight * ay + dy) * width;
                    for (var dx = 0; dx < areaWidth; dx++) {
                        var target = data[baseCoord + dx];
                        if (target < min) {
                            min = target;
                        }
                        if (target > max) {
                            max = target;
                        }
                    }
                }
                minmax[ax][ay][0] = min;
                minmax[ax][ay][1] = max;
                // minmax[ax][ay][0] = (minmax[ax][ay][0] + minmax[ax][ay][1]) / 2;
            }
        }
        var middle = new Array(numSqrtArea);
        for (var i3 = 0; i3 < numSqrtArea; i3++) {
            middle[i3] = new Array(numSqrtArea);
        }
        for (ay = 0; ay < numSqrtArea; ay++) {
            for (ax = 0; ax < numSqrtArea; ax++) {
                middle[ax][ay] = Math.floor((minmax[ax][ay][0] + minmax[ax][ay][1]) / 2);
            }
        }
        return middle;
    }

    function grayScaleToBitmap(grayScale) {
        var middle = getMiddleBrightnessPerArea(grayScale);
        var sqrtNumArea = middle.length;
        var areaWidth = Math.floor(width / sqrtNumArea);
        var areaHeight = Math.floor(height / sqrtNumArea);
        var bitmap = new Uint8Array(height * width);

        for (var ay = 0; ay < sqrtNumArea; ay++) {
            for (var ax = 0; ax < sqrtNumArea; ax++) {
                for (var dy = 0; dy < areaHeight; dy++) {
                    for (var dx = 0; dx < areaWidth; dx++) {
                        bitmap[areaWidth * ax + dx + (areaHeight * ay + dy) * width] =
                            grayScale[areaWidth * ax + dx + (areaHeight * ay + dy) * width] < middle[ax][ay];
                    }
                }
            }
        }
        return bitmap;
    }

    function grayscale() {
        var data = imageData.data;
        var ret = new Uint8Array(width * height);
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                var point = (x * 4) + (y * width * 4);
                ret[x + y * width] = (data[point] * 33 + data[point + 1] * 34 + data[point + 2] * 33) / 100;
            }
        }
        return ret;
    }
}

module.exports = QrCode;
