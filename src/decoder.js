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

var ReedSolomonDecoder = require('./reed-solomon-decoder');
var GF256 = require('./gf256').GF256;
var BitMatrixParser = require('./bit-matrix-parser');
var DataBlock = require('./data-block');
var QRCodeDataBlockReader = require('./qr-code-data-block-reader');


var Decoder = {};
Decoder.rsDecoder = new ReedSolomonDecoder(GF256.QR_CODE_FIELD);

Decoder.correctErrors = function (codewordBytes, numDataCodewords) {
    var numCodewords = codewordBytes.length;
    // First read into an array of ints
    var codewordsInts = new Array(numCodewords);
    var i;
    for (i = 0; i < numCodewords; i++) {
        codewordsInts[i] = codewordBytes[i] & 0xFF;
    }
    var numECCodewords = codewordBytes.length - numDataCodewords;
    try {
        Decoder.rsDecoder.decode(codewordsInts, numECCodewords);
        // var corrector = new ReedSolomon(codewordsInts, numECCodewords);
        // corrector.correct();
    } catch (rse) {
        throw rse;
    }
    // Copy back into array of bytes -- only need to worry about the bytes that were data
    // We don't care about errors in the error-correction codewords
    for (i = 0; i < numDataCodewords; i++) {
        codewordBytes[i] = codewordsInts[i];
    }
};

Decoder.decode = function (bits) {
    var parser = new BitMatrixParser(bits);
    var version = parser.readVersion();
    var ecLevel = parser.readFormatInformation().errorCorrectionLevel;

    // Read codewords
    var codewords = parser.readCodewords();

    // Separate into data blocks
    var dataBlocks = DataBlock.getDataBlocks(codewords, version, ecLevel);

    // Count total number of data bytes
    var totalBytes = 0;
    var i;
    for (i = 0; i < dataBlocks.length; i++) {
        totalBytes += dataBlocks[i].numDataCodewords;
    }
    var resultBytes = new Array(totalBytes);
    var resultOffset = 0;

    // Error-correct and copy data blocks together into a stream of bytes
    for (var j = 0; j < dataBlocks.length; j++) {
        var dataBlock = dataBlocks[j];
        var codewordBytes = dataBlock.codewords;
        var numDataCodewords = dataBlock.numDataCodewords;
        Decoder.correctErrors(codewordBytes, numDataCodewords);
        for (i = 0; i < numDataCodewords; i++) {
            resultBytes[resultOffset++] = codewordBytes[i];
        }
    }

    // Decode the contents of that stream of bytes
    return new QRCodeDataBlockReader(resultBytes, version.versionNumber, ecLevel.bits);
    // return DecodedBitStreamParser.decode(resultBytes, version, ecLevel);
};

module.exports = Decoder;
