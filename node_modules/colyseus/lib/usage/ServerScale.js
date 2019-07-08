"use strict";
//
// This example shows how to scale the Colyseus.Server.
//
// You must specify the `presence` option on Colyseus.Server when using multiple
// processes. This example uses Redis as presence server.
//
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const Server_1 = require("../src/Server");
const ChatRoom_1 = require("./ChatRoom");
const RedisPresence_1 = require("./../src/presence/RedisPresence");
const port = Number(process.env.PORT || 2657);
const endpoint = "localhost";
const app = express_1.default();
// Create HTTP & WebSocket servers
const server = http_1.default.createServer(app);
const gameServer = new Server_1.Server({
    verifyClient: (info, next) => {
        // console.log("custom verifyClient!");
        next(true);
    },
    presence: new RedisPresence_1.RedisPresence(),
    server: server
});
// Register ChatRoom as "chat"
gameServer.register("chat", ChatRoom_1.ChatRoom).then(handler => {
    handler.
        // demonstrating public events.
        on("create", (room) => console.log("handler: room created!", room.roomId)).
        on("join", (room, client) => console.log("handler: client", client.sessionId, "joined", room.roomId)).
        on("leave", (room, client) => console.log("handler: client", client.sessionId, "left", room.roomId)).
        on("dispose", (room) => console.log("handler: room disposed!", room.roomId));
});
app.use(express_1.default.static(__dirname));
app.use(body_parser_1.default.json());
gameServer.listen(port);
console.log(`Listening on http://localhost:${port}`);
