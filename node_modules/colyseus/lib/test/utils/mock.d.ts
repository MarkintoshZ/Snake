import { EventEmitter } from "events";
import { Room } from "../../src/Room";
export declare class Client extends EventEmitter {
    id: string;
    messages: Array<any>;
    readyState: number;
    constructor(id?: string);
    send(message: any): void;
    receive(message: any): void;
    getMessageAt(index: number): any;
    readonly lastMessage: any;
    close(code?: number): void;
}
export declare function createEmptyClient(): any;
export declare function createDummyClient(options?: any): any;
export declare function awaitForTimeout(ms?: number): Promise<{}>;
export declare class DummyRoom extends Room {
    constructor();
    requestJoin(options: any): boolean;
    onInit(): void;
    onDispose(): void;
    onJoin(): void;
    onLeave(): void;
    onMessage(client: any, message: any): void;
}
export declare class RoomWithError extends Room {
    constructor();
    onInit(): void;
    onDispose(): void;
    onJoin(): void;
    onLeave(): void;
    onMessage(): void;
}
export declare class DummyRoomWithState extends Room {
    constructor();
    requestJoin(options: any): boolean;
    onInit(): void;
    onDispose(): void;
    onJoin(): void;
    onLeave(): void;
    onMessage(): void;
}
export declare class RoomVerifyClient extends DummyRoom {
    patchRate: number;
    onJoin(): void;
}
export declare class RoomWithAsync extends DummyRoom {
    static ASYNC_TIMEOUT: number;
    maxClients: number;
    onAuth(): Promise<boolean>;
    onJoin(): void;
    onLeave(): Promise<void>;
    onDispose(): Promise<void>;
}
export declare class RoomVerifyClientWithLock extends DummyRoom {
    patchRate: number;
    verifyClient(): Promise<{}>;
    onJoin(): void;
}
export declare function utf8Read(buff: Buffer, offset: number): string;
