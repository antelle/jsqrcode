/*
 Copyright 2016 Antelle

 Ported from ZXing source

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

var BitMatrix = require('./bit-matrix');

var PureBitsExtractor = {
    extractPureBits: function(bitmap) {
        var leftTopBlack = this.getTopLeftOnBit(bitmap);
        var rightBottomBlack = this.getBottomRightOnBit(bitmap);
        if (!leftTopBlack || !rightBottomBlack) {
            throw 'not found';
        }

        var moduleSize = this.getModuleSize(leftTopBlack, bitmap);
        if (!moduleSize) {
            throw 'not found';
        }

        var top = leftTopBlack[1];
        var bottom = rightBottomBlack[1];
        var left = leftTopBlack[0];
        var right = rightBottomBlack[0];

        // Sanity check!
        if (left >= right || top >= bottom) {
            throw 'not found';
        }

        if (bottom - top !== right - left) {
            // Special case, where bottom-right module wasn't black so we found something else in the last row
            // Assume it's a square, so use height as the width
            right = left + (bottom - top);
        }

        var matrixWidth = Math.round((right - left + 1) / moduleSize);
        var matrixHeight = Math.round((bottom - top + 1) / moduleSize);
        if (matrixWidth <= 0 || matrixHeight <= 0) {
            throw 'not found';
        }
        if (matrixHeight !== matrixWidth) {
            // Only possibly decode square regions
            throw 'not found';
        }

        // Push in the "border" by half the module width so that we start
        // sampling in the middle of the module. Just in case the image is a
        // little off, this will help recover.
        var nudge = Math.floor(moduleSize / 2);
        top += nudge;
        left += nudge;

        // But careful that this does not sample off the edge
        // "right" is the farthest-right valid pixel location -- right+1 is not necessarily
        // This is positive by how much the inner x loop below would be too large
        var nudgedTooFarRight = left + (matrixWidth - 1) * moduleSize - right;
        if (nudgedTooFarRight > 0) {
            if (nudgedTooFarRight > nudge) {
                // Neither way fits; abort
                throw 'not found';
            }
            left -= nudgedTooFarRight;
        }
        // See logic above
        var nudgedTooFarDown = top + (matrixHeight - 1) * moduleSize - bottom;
        if (nudgedTooFarDown > 0) {
            if (nudgedTooFarDown > nudge) {
                // Neither way fits; abort
                throw 'not found';
            }
            top -= nudgedTooFarDown;
        }

        // Now just read off the bits
        var width = bitmap.width;
        var bits = new BitMatrix(matrixWidth, matrixHeight);
        for (var y = 0; y < matrixHeight; y++) {
            var iOffset = top + y * moduleSize;
            for (var x = 0; x < matrixWidth; x++) {
                if (bitmap[left + x * moduleSize + iOffset * width]) {
                    bits.setValue(x, y);
                }
            }
        }
        return bits;
    },

    getModuleSize: function(leftTopBlack, bitmap) {
        var height = bitmap.height;
        var width = bitmap.width;
        var x = leftTopBlack[0];
        var y = leftTopBlack[1];
        var inBlack = 1;
        var transitions = 0;
        while (x < width && y < height) {
            if (inBlack !== bitmap[x + y * width]) {
                if (++transitions === 5) {
                    break;
                }
                inBlack = inBlack ? 0 : 1;
            }
            x++;
            y++;
        }
        if (x === width || y === height) {
            return null;
        }
        return (x - leftTopBlack[0]) / 7.0;
    },

    getTopLeftOnBit: function(bitmap) {
        var bitsOffset = 0;
        while (bitsOffset < bitmap.length && bitmap[bitsOffset] === 0) {
            bitsOffset++;
        }
        if (bitsOffset === bitmap.length) {
            throw 'not found';
        }

        var x = bitsOffset % bitmap.width;
        var y = Math.floor(bitsOffset / bitmap.width);

        return [x, y];
    },

    getBottomRightOnBit: function(bitmap) {
        var bitsOffset = bitmap.length - 1;
        while (bitsOffset >= 0 && bitmap[bitsOffset] === 0) {
            bitsOffset--;
        }
        if (bitsOffset < 0) {
            throw 'not found';
        }

        var x = bitsOffset % bitmap.width;
        var y = Math.floor(bitsOffset / bitmap.width);

        return [x, y];
    }
};

module.exports = PureBitsExtractor;
