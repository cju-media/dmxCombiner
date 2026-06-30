"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.empty = exports.bit = exports.inRange = exports.objectify = exports.dp = exports.multicastGroup = void 0;
function multicastGroup(universe) {
    if ((universe > 0 && universe <= 63999) || universe === 64214) {
        return `239.255.${universe >> 8}.${universe & 255}`;
    }
    throw new RangeError('universe must be between 1-63999');
}
exports.multicastGroup = multicastGroup;
const dp = (n, decimals = 2) => Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
exports.dp = dp;
function objectify(buf) {
    const data = {};
    for (const [ch, val] of buf.entries()) {
        if (val > 0)
            data[ch + 1] = (0, exports.dp)(val / 2.55, 2); // rounding to 2dp will not lose any data
    }
    return data;
}
exports.objectify = objectify;
const inRange = (n) => Math.min(255, Math.max(Math.round(n), 0));
exports.inRange = inRange;
function bit(bitt, num) {
    if (bitt % 8)
        throw new Error('num of bits must be divisible by 8');
    const chunks = [];
    for (let i = 0; i < bitt; i += 8) {
        chunks.unshift((num >> i) & 255);
    }
    return chunks;
}
exports.bit = bit;
const empty = (len) => [
    ...new Uint8Array(new ArrayBuffer(len)),
];
exports.empty = empty;
