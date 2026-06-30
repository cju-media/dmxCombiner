/// <reference types="node" />
export declare const ACN_PID: Buffer;
/**
 * "The CID shall be a UUID [...] that is a 128-bit number / Each piece
 * of equipment should maintain the same CID for its entire lifetime"
 * - E1.31
 */
export declare const DEFAULT_CID: Buffer;
export declare enum RootVector {
    DATA = 4,
    EXTENDED = 8
}
export declare enum FrameVector {
    DATA = 2
}
export declare enum DmpVector {
    DATA = 2
}
