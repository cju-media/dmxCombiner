/// <reference types="node" />
/** Channel 1 is index 1. There is no index 0. The value range is `0-100` */
export declare type Payload = {
    [channel: number]: number;
};
export declare function multicastGroup(universe: number): string;
export declare const dp: (n: number, decimals?: number) => number;
export declare function objectify(buf: Buffer): Payload;
export declare const inRange: (n: number) => number;
export declare function bit(bitt: 8 | 16 | 24 | 32, num: number): number[];
export declare const empty: (len: number) => number[];
