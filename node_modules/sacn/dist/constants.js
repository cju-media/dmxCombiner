"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DmpVector = exports.FrameVector = exports.RootVector = exports.DEFAULT_CID = exports.ACN_PID = void 0;
exports.ACN_PID = Buffer.from([
    0x41,
    0x53,
    0x43,
    0x2d,
    0x45,
    0x31,
    0x2e,
    0x31,
    0x37,
    0x00,
    0x00,
    0x00,
]);
/**
 * "The CID shall be a UUID [...] that is a 128-bit number / Each piece
 * of equipment should maintain the same CID for its entire lifetime"
 * - E1.31
 */
exports.DEFAULT_CID = Buffer.from([
    0x6b, 0x79, 0x6c, 0x65, 0x48, 0x65, 0x6e, 0x73, 0x65, 0x6c, 0x44, 0x65, 0x66,
    0x61, 0x75, 0x6c,
]);
var RootVector;
(function (RootVector) {
    RootVector[RootVector["DATA"] = 4] = "DATA";
    RootVector[RootVector["EXTENDED"] = 8] = "EXTENDED";
})(RootVector = exports.RootVector || (exports.RootVector = {}));
var FrameVector;
(function (FrameVector) {
    FrameVector[FrameVector["DATA"] = 2] = "DATA";
})(FrameVector = exports.FrameVector || (exports.FrameVector = {}));
var DmpVector;
(function (DmpVector) {
    DmpVector[DmpVector["DATA"] = 2] = "DATA";
})(DmpVector = exports.DmpVector || (exports.DmpVector = {}));
// export enum ExtendedFrameVector { SYNC = 1, DISCOVERY = 2 }
