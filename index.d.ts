import { EventEmitter } from 'events';
import { Socket } from 'dgram';

interface ClientOptions {
    host?: string;
    port?: number | string;
    transport?: string;
};

interface ClientOptionsPromise extends ClientOptions {
    returnPromise: true;
}

interface RiemannPayloadArgs {
    service?: string;
    metric?: number;
    tags?: string[];
    host?: string;
    time?: number;
    [key: string]: any;
}

type RiemannPayload = () => void;
type RiemannPayloadPromise = () => Promise<void>;

export class RiemannClient extends EventEmitter {
    constructor(options?: ClientOptions, onConnect: () => void);
    tcp: Socket;
    udp: Socket
    Event(event: RiemannPayloadArgs, transport?: Socket): RiemannPayload;
    Query(event: RiemannPayloadArgs, transport?: Socket): RiemannPayload;
    State(event: RiemannPayloadArgs, transport?: Socket): RiemannPayload;
    disconnect(onDisconnect?: () => void): void;
    send<T extends RiemannPayload | RiemannPayloadPromise>(payload: T, transport?: Socket): ReturnType<T>;
}

export class PromiseRiemannClient extends RiemannClient {
    constructor(options: ClientOptionsPromise, onConnect: () => void);
    Event(event: RiemannEvent, transport?: Socket): RiemannPayloadPromise;
    Query(event: RiemannEvent, transport?: Socket): RiemannPayloadPromise;
    State(event: RiemannEvent, transport?: Socket): RiemannPayloadPromise;
    disconnect(): Promise<void>;
}

export function createClient(options: ClientOptions, onConnect?: () => void): RiemannClient;
export function createClient(options: ClientOptionsPromise, onConnect?: onConnect): Promise<PromiseRiemannClient>;
