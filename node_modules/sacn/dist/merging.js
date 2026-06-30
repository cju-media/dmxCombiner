"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MergingReceiver = void 0;
const perf_hooks_1 = require("perf_hooks");
const receiver_1 = require("./receiver");
class MergingReceiver extends receiver_1.Receiver {
    constructor(_a) {
        var { mode = 'HTP', timeout = 5000 } = _a, props = __rest(_a, ["mode", "timeout"]);
        super(props);
        this.data = new Map();
        this.mode = mode;
        this.timeout = timeout;
        super.on('packet', (packet) => {
            const data = this.prepareData(packet);
            const mergedData = MergingReceiver[this.mode](data);
            this.handleChanges(data, mergedData);
        });
    }
    prepareData(packet) {
        const currentTime = perf_hooks_1.performance.now();
        const universe = parseInt(packet.universe.toString(36), 10);
        const cid = packet.cid.toString();
        // universe is unknown
        if (!this.data.has(universe)) {
            this.data.set(universe, {
                referenceData: {},
                servers: new Map(),
            });
            this.emit('newUniverse', {
                universe,
                firstPacket: packet,
            });
        }
        const universeData = this.data.get(universe);
        if (!universeData) {
            throw new Error('[sACN] Internal Error: universeData is undefined');
        }
        // sender is unknown for this universe
        if (!universeData.servers.has(cid)) {
            this.emit('senderConnect', {
                cid: packet.cid,
                universe,
                firstPacket: packet,
            });
        }
        // register current package
        universeData.servers.set(cid, {
            packet,
            timestamp: currentTime,
        });
        // check whether sender disconnects
        setTimeout(() => {
            var _a;
            if (((_a = universeData.servers.get(cid)) === null || _a === void 0 ? void 0 : _a.timestamp) === currentTime) {
                universeData.servers.delete(cid);
                this.emit('senderDisconnect', {
                    cid: packet.cid,
                    universe,
                    lastPacket: packet,
                });
            }
        }, this.timeout);
        // detect which source has the highest per-universe priority
        let maximumPriority = 0;
        for (const [, { packet: thisPacket }] of universeData.servers) {
            if (thisPacket.priority > maximumPriority &&
                thisPacket.universe === packet.universe) {
                maximumPriority = thisPacket.priority;
            }
        }
        return {
            universe,
            maximumPriority,
            universeData,
        };
    }
    handleChanges(data, mergedData) {
        const { referenceData } = data.universeData;
        // only changes
        let changesDetected = false;
        for (let ch = 1; ch <= 512; ch += 1) {
            if (referenceData[ch] !== mergedData[ch]) {
                changesDetected = true;
                const event = {
                    universe: data.universe,
                    address: ch,
                    newValue: mergedData[ch],
                    oldValue: referenceData[ch],
                };
                super.emit('changedValue', event);
            }
        }
        if (changesDetected) {
            this.data.get(data.universe).referenceData = mergedData;
            const event = {
                universe: data.universe,
                payload: mergedData,
            };
            super.emit('changed', event);
        }
    }
    static HTP(data) {
        var _a;
        const mergedData = {};
        for (const [, { packet }] of data.universeData.servers) {
            if (packet.priority === data.maximumPriority &&
                packet.universe === data.universe) {
                for (let ch = 1; ch <= 512; ch += 1) {
                    const newValue = packet.payload[ch] || 0;
                    if (((_a = mergedData[ch]) !== null && _a !== void 0 ? _a : 0) <= newValue) {
                        mergedData[ch] = newValue;
                    }
                }
            }
        }
        return mergedData;
    }
    /**
     * LTP can only operate per-universe, not per-channel. There is no
     * situation where LTP-per-channel would be useful.
     *
     * Therefore, this function just returns the packet with the highest
     * priority and the latest timestamp.
     */
    static LTP(data) {
        let maximumTimestamp = -Infinity;
        for (const [, { packet, timestamp }] of data.universeData.servers) {
            if (packet.priority === data.maximumPriority &&
                packet.universe === data.universe &&
                timestamp > maximumTimestamp) {
                maximumTimestamp = timestamp;
            }
        }
        for (const [, { packet, timestamp }] of data.universeData.servers) {
            if (packet.priority === data.maximumPriority &&
                packet.universe === data.universe &&
                timestamp === maximumTimestamp) {
                return packet.payload;
            }
        }
        throw new Error('Internal error');
    }
}
exports.MergingReceiver = MergingReceiver;
