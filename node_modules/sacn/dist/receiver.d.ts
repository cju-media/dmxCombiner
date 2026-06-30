/// <reference types="node" />
import { EventEmitter } from 'events';
import { AssertionError } from 'assert';
import { Packet } from './packet';
/** @deprecated - use {@link Receiver.Props} instead */
export declare type ReceiverProps = Receiver.Props;
export declare namespace Receiver {
    interface Props {
        /** List of universes to listen to. Must be within `1-63999 */
        universes?: number[];
        /** The multicast port to use. All professional consoles broadcast to the default port. */
        port?: number;
        /** local ip address of network inteface to use */
        iface?: string;
        /** Allow multiple programs on your computer to listen to the same sACN universe. */
        reuseAddr?: boolean;
    }
    interface EventMap {
        packet: Packet;
        PacketCorruption: AssertionError;
        PacketOutOfOrder: Error;
        error: Error;
    }
}
export declare interface Receiver {
    on<K extends keyof Receiver.EventMap>(type: K, listener: (event: Receiver.EventMap[K]) => void): this;
}
export declare class Receiver extends EventEmitter {
    private socket;
    private lastSequence;
    private readonly port;
    universes: NonNullable<Receiver.Props['universes']>;
    private readonly iface;
    constructor({ universes, port, iface, reuseAddr, }: Receiver.Props);
    addUniverse(universe: number): this;
    removeUniverse(universe: number): this;
    close(callback?: () => void): this;
}
