"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const Serializer_1 = require("../src/serializer/Serializer");
const SchemaSerializer_1 = require("../src/serializer/SchemaSerializer");
const schema_1 = require("@colyseus/schema");
class State extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.lastMessage = "";
    }
}
__decorate([
    schema_1.type("string")
], State.prototype, "lastMessage", void 0);
let ChatRoom = class ChatRoom extends src_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 4;
        this.patchRate = 1000;
    }
    onInit(options) {
        this.setState(new State());
    }
    onAuth(options) {
        return __awaiter(this, void 0, void 0, function* () {
            return { success: true };
        });
    }
    onJoin(client, options, auth) {
        console.log("client has joined!");
        console.log("client.id:", client.id);
        console.log("client.sessionId:", client.sessionId);
        console.log("with options", options);
        this.state.lastMessage = `${client.id} joined.`;
    }
    requestJoin(options, isNewRoom) {
        return (options.create)
            ? (options.create && isNewRoom)
            : this.clients.length > 0;
    }
    onLeave(client, consented) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("IS CONSENTED?", consented);
            try {
                if (consented)
                    throw new Error("just close!");
                yield this.allowReconnection(client, 10);
                console.log("CLIENT RECONNECTED");
            }
            catch (e) {
                this.state.lastMessage = `${client.id} left.`;
                console.log("ChatRoom:", client.sessionId, "left!");
            }
        });
    }
    onMessage(client, data) {
        this.state.lastMessage = data;
        if (data === "leave") {
            this.disconnect().then(() => console.log("yup, disconnected."));
        }
        console.log("ChatRoom:", client.id, data);
    }
    onDispose() {
        console.log("Disposing ChatRoom...");
        // perform async tasks to disconnect all players
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                console.log("async task finished, let's dispose the room now!");
                resolve();
            }, 2000);
        });
    }
};
ChatRoom = __decorate([
    Serializer_1.serialize(SchemaSerializer_1.SchemaSerializer)
], ChatRoom);
exports.ChatRoom = ChatRoom;
