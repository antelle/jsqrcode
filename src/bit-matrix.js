/*
 Ported to JavaScript by Lazar Laszlo 2011

 lazarsoft@gmail.com, www.lazarsoft.info

 */

/*
 *
 * Copyright 2007 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var URShift = require('./utils').URShift;

function BitMatrix(width, height) {
    if (!height) {
        // noinspection JSSuspiciousNameCombination
        height = width;
    }
    if (width < 1 || height < 1) {
        throw 'Both dimensions must be greater than 0';
    }
    this.width = width;
    this.height = height;
    var rowSize = width >> 5;
    if ((width & 0x1f) !== 0) {
        rowSize++;
    }
    this.rowSize = rowSize;
    this.bits = new Array(rowSize * height);
    for (var i = 0; i < this.bits.length; i++) {
        this.bits[i] = 0;
    }

    this.getDimension = function() {
        if (this.width !== this.height) {
            throw 'Can get dimension on a non-square matrix';
        }
        return this.width;
    };

    this.getValue = function (x, y) {
        var offset = y * this.rowSize + (x >> 5);
        return ((URShift(this.bits[offset], (x & 0x1f))) & 1) !== 0;
    };

    this.setValue = function (x, y) {
        var offset = y * this.rowSize + (x >> 5);
        this.bits[offset] |= 1 << (x & 0x1f);
    };

    this.flip = function (x, y) {
        var offset = y * this.rowSize + (x >> 5);
        this.bits[offset] ^= 1 << (x & 0x1f);
    };

    this.setRegion = function (left, top, rwidth, rheight) {
        if (top < 0 || left < 0) {
            throw 'Left and top must be nonnegative';
        }
        if (rheight < 1 || rwidth < 1) {
            throw 'Height and width must be at least 1';
        }
        var right = left + rwidth;
        var bottom = top + rheight;
        if (bottom > this.height || right > this.width) {
            throw 'The region must fit inside the matrix';
        }
        for (var y = top; y < bottom; y++) {
            var offset = y * this.rowSize;
            for (var x = left; x < right; x++) {
                this.bits[offset + (x >> 5)] |= 1 << (x & 0x1f);
            }
        }
    };
}

module.exports = BitMatrix;
