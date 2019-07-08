/// <reference types="node" />
import Clock, { Delayed } from '@gamestdio/timer';
import http from 'http';
import WebSocket from 'ws';
export { Server } from './Server';
export { Room, RoomAvailable } from './Room';
export { Protocol } from './Protocol';
export { RegisteredHandler } from './matchmaker/RegisteredHandler';
export { Presence } from './presence/Presence';
export { LocalPresence } from './presence/LocalPresence';
export { RedisPresence } from './presence/RedisPresence';
export { FossilDeltaSerializer } from './serializer/FossilDeltaSerializer';
export { SchemaSerializer } from './serializer/SchemaSerializer';
export { serialize } from './serializer/Serializer';
export { Clock, Delayed };
export { nonenumerable as nosync } from 'nonenumerable';
export declare function generateId(): any;
export declare function isValidId(id: string): boolean;
export declare type Client = WebSocket & {
    upgradeReq?: http.IncomingMessage;
    id: string;
    options: any;
    sessionId: string;
    pingCount: number;
    remote?: boolean;
    auth?: any;
};
