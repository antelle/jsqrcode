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

var FormatInformation = require('./format-information');
var Version = require('./version');
var DataMask = require('./data-mask');

function BitMatrixParser(bitMatrix) {
    var dimension = bitMatrix.getDimension();
    if (dimension < 21 || (dimension & 0x03) !== 1) {
        throw 'Error BitMatrixParser';
    }
    this.bitMatrix = bitMatrix;
    this.parsedVersion = null;
    this.parsedFormatInfo = null;

    this.copyBit = function (i, j, versionBits) {
        return this.bitMatrix.getValue(i, j) ? (versionBits << 1) | 0x1 : versionBits << 1;
    };

    this.readFormatInformation = function () {
        if (this.parsedFormatInfo) {
            return this.parsedFormatInfo;
        }

        // Read top-left format info bits
        var formatInfoBits = 0;
        var i;
        for (i = 0; i < 6; i++) {
            formatInfoBits = this.copyBit(i, 8, formatInfoBits);
        }
        // .. and skip a bit in the timing pattern ...
        formatInfoBits = this.copyBit(7, 8, formatInfoBits);
        formatInfoBits = this.copyBit(8, 8, formatInfoBits);
        formatInfoBits = this.copyBit(8, 7, formatInfoBits);
        // .. and skip a bit in the timing pattern ...
        for (var j = 5; j >= 0; j--) {
            formatInfoBits = this.copyBit(8, j, formatInfoBits);
        }

        this.parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits);
        if (this.parsedFormatInfo) {
            return this.parsedFormatInfo;
        }

        // Hmm, failed. Try the top-right/bottom-left pattern
        var dim = this.bitMatrix.getDimension();
        formatInfoBits = 0;
        var iMin = dim - 8;
        for (i = dim - 1; i >= iMin; i--) {
            formatInfoBits = this.copyBit(i, 8, formatInfoBits);
        }
        for (j = dim - 7; j < dim; j++) {
            formatInfoBits = this.copyBit(8, j, formatInfoBits);
        }

        this.parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits);
        if (this.parsedFormatInfo) {
            return this.parsedFormatInfo;
        }
        throw 'Error readFormatInformation';
    };

    this.readVersion = function () {
        if (this.parsedVersion) {
            return this.parsedVersion;
        }

        var dim = this.bitMatrix.getDimension();

        var provisionalVersion = (dim - 17) >> 2;
        if (provisionalVersion <= 6) {
            return Version.getVersionForNumber(provisionalVersion);
        }

        // Read top-right version info: 3 wide by 6 tall
        var versionBits = 0;
        var ijMin = dim - 11;
        var i, j;
        for (j = 5; j >= 0; j--) {
            for (i = dim - 9; i >= ijMin; i--) {
                versionBits = this.copyBit(i, j, versionBits);
            }
        }

        this.parsedVersion = Version.decodeVersionInformation(versionBits);
        if (this.parsedVersion && this.parsedVersion.getDimensionForVersion() === dim) {
            return this.parsedVersion;
        }

        // Hmm, failed. Try bottom left: 6 wide by 3 tall
        versionBits = 0;
        for (i = 5; i >= 0; i--) {
            for (j = dim - 9; j >= ijMin; j--) {
                versionBits = this.copyBit(i, j, versionBits);
            }
        }

        this.parsedVersion = Version.decodeVersionInformation(versionBits);
        if (this.parsedVersion && this.parsedVersion.getDimensionForVersion() === dim) {
            return this.parsedVersion;
        }
        throw 'Error readVersion';
    };

    this.readCodewords = function () {
        var formatInfo = this.readFormatInformation();
        var version = this.readVersion();

        // Get the data mask for the format used in this QR Code. This will exclude
        // some bits from reading as we wind through the bit matrix.
        var dataMask = DataMask.forReference(formatInfo.dataMask);
        var dim = this.bitMatrix.getDimension();
        dataMask.unmaskBitMatrix(this.bitMatrix, dim);

        var functionPattern = version.buildFunctionPattern();

        var readingUp = true;
        var result = new Array(version.totalCodewords);
        var resultOffset = 0;
        var currentByte = 0;
        var bitsRead = 0;
        // Read columns in pairs, from right to left
        for (var j = dim - 1; j > 0; j -= 2) {
            if (j === 6) {
                // Skip whole column with vertical alignment pattern;
                // saves time and makes the other code proceed more cleanly
                j--;
            }
            // Read alternatingly from bottom to top then top to bottom
            for (var count = 0; count < dim; count++) {
                var i = readingUp ? dim - 1 - count : count;
                for (var col = 0; col < 2; col++) {
                    // Ignore bits covered by the function pattern
                    if (!functionPattern.getValue(j - col, i)) {
                        // Read a bit
                        bitsRead++;
                        currentByte <<= 1;
                        if (this.bitMatrix.getValue(j - col, i)) {
                            currentByte |= 1;
                        }
                        // If we've made a whole byte, save it off
                        if (bitsRead === 8) {
                            result[resultOffset++] = currentByte;
                            bitsRead = 0;
                            currentByte = 0;
                        }
                    }
                }
            }
            readingUp ^= true; // readingUp = !readingUp; // switch directions
        }
        if (resultOffset !== version.totalCodewords) {
            throw 'Error readCodewords';
        }
        return result;
    };
}

module.exports = BitMatrixParser;
