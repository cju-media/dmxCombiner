import type { Packet } from './packet';
import { Receiver } from './receiver';
import type { Payload } from './util';
/**
 * @deprecated CAUTION: This feature is experimental,
 * and has not been thoroughly tested. It may not behave
 * correctly. There is no guarantee that it adheres to
 * the E1.33 standard.
 */
export declare namespace MergingReceiver {
    /** See {@link Props.mode here} for docs */
    type Mode = 'HTP' | 'LTP';
    interface Props extends Receiver.Props {
        /**
         * ### Different priority
         * .
         * When merging, all senders should normally have a different
         * `priority`. Following this rule will prevent most of the
         * confusion around merging.
         *
         * 💡 _Use case: tracking-backup console._
         *
         * ### Same priority
         * .
         * If there are 2 senders with the same `priority`,
         * then you need to specify the merging mode:
         *
         * - `HTP` = **H**ighest **t**akes **P**riority. This means
         * that the receiver will use the highest channel value from
         * all senders with the same `priority`. If there is a
         * malfunction, channels may appear to be stuck, even when
         * blacked-out on one console.
         * 💡 _Use case: {@link https://youtu.be/vygFW9FDYtM parking a channel}
         * or controlling {@link https://en.wiktionary.org/wiki/houselights houselights}
         * from a different console._
         *
         * - `LTP` = **L**atest **t**akes **P**riority. This means that
         * the receiver will use the latest data that it receives from
         * the senders with the highest `priority`. **This options is
         * not recomended, because a malfunction will cause of lights
         * to flicker uncontrollably.**
         * 💡 _Use case: none._
         *
         * ℹ️ Please refer to the README for more information.
         *
         * @default 'HTP'
         */
        mode?: Mode;
        timeout?: number;
    }
    interface EventMap extends Receiver.EventMap {
        changed: {
            universe: number;
            payload: Payload;
        };
        changedValue: {
            universe: number;
            address: number;
            newValue: number;
            oldValue: number;
        };
        changesDone: never;
        senderConnect: {
            cid: number;
            universe: number;
            firstPacket: Packet;
        };
        senderDisconnect: {
            cid: number;
            universe: number;
            lastPacket: Packet;
        };
    }
    interface PacketWithTime {
        readonly packet: Packet;
        readonly timestamp: number;
    }
    interface UniverseData {
        referenceData: Payload;
        servers: Map<string, PacketWithTime>;
    }
    interface PreparedData {
        universe: number;
        maximumPriority: number;
        universeData: UniverseData;
    }
}
export declare interface MergingReceiver {
    on<K extends keyof MergingReceiver.EventMap>(type: K, listener: (event: MergingReceiver.EventMap[K]) => void): this;
}
export declare class MergingReceiver extends Receiver {
    private readonly mode;
    private readonly timeout;
    private data;
    constructor({ mode, timeout, ...props }: MergingReceiver.Props);
    private prepareData;
    private handleChanges;
    static HTP(data: MergingReceiver.PreparedData): Payload;
    /**
     * LTP can only operate per-universe, not per-channel. There is no
     * situation where LTP-per-channel would be useful.
     *
     * Therefore, this function just returns the packet with the highest
     * priority and the latest timestamp.
     */
    static LTP(data: MergingReceiver.PreparedData): Payload;
}
