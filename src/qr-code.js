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
        var gs = grayScaleToBitmap(grayscale());

        gs.width = width;
        gs.height = height;
        gs.imagedata = imageData;
        var detector = new Detector(gs);

        var qRCodeMatrix = detector.detect();

        var reader = Decoder.decode(qRCodeMatrix.bits);
        var data = reader.getDataByte();
        var str = '';
        for (var i = 0; i < data.length; i++) {
            for (var j = 0; j < data[i].length; j++) {
                str += String.fromCharCode(data[i][j]);
            }
        }

        return str;
    }

    function getPixel(x, y) {
        if (width < x || height < y) {
            throw 'point error';
        }
        var point = (x * 4) + (y * width * 4);
        return (imageData.data[point] * 33 + imageData.data[point + 1] * 34 + imageData.data[point + 2] * 33) / 100;
    }

    function getMiddleBrightnessPerArea() {
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
                minmax[ax][ay][0] = 0xFF;
                for (var dy = 0; dy < areaHeight; dy++) {
                    for (var dx = 0; dx < areaWidth; dx++) {
                        var target = image[areaWidth * ax + dx + (areaHeight * ay + dy) * width];
                        if (target < minmax[ax][ay][0]) {
                            minmax[ax][ay][0] = target;
                        }
                        if (target > minmax[ax][ay][1]) {
                            minmax[ax][ay][1] = target;
                        }
                    }
                }
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
        var bitmap = new Array(height * width);

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
        var ret = new Array(width * height);
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {
                ret[x + y * width] = getPixel(x, y);
            }
        }
        return ret;
    }
}

module.exports = QrCode;
