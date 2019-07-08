import { Room } from "../src";
import { Schema } from "@colyseus/schema";
declare class State extends Schema {
    lastMessage: string;
}
export declare class ChatRoom extends Room<State> {
    maxClients: number;
    patchRate: number;
    onInit(options: any): void;
    onAuth(options: any): Promise<{
        success: boolean;
    }>;
    onJoin(client: any, options: any, auth: any): void;
    requestJoin(options: any, isNewRoom: boolean): boolean;
    onLeave(client: any, consented: any): Promise<void>;
    onMessage(client: any, data: any): void;
    onDispose(): Promise<{}>;
}
export {};
