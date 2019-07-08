"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
// import WebSocket from "uws";
const Server_1 = require("../src/Server");
const ChatRoom_1 = require("./ChatRoom");
const port = Number(process.env.PORT || 2657);
const endpoint = "localhost";
const app = express_1.default();
app.use(body_parser_1.default.json());
// Create HTTP & WebSocket servers
const server = http_1.default.createServer(app);
const gameServer = new Server_1.Server({
    // engine: WebSocket.Server,
    server: server
});
// Register ChatRoom as "chat"
gameServer.register("chat", ChatRoom_1.ChatRoom).then((handler) => {
    // demonstrating public events.
    handler.
        on("create", (room) => console.log("room created!", room.roomId)).
        on("join", (room, client) => console.log("client", client.id, "joined", room.roomId)).
        on("leave", (room, client) => console.log("client", client.id, "left", room.roomId)).
        on("dispose", (room) => console.log("room disposed!", room.roomId));
});
app.use(express_1.default.static(__dirname));
app.get("/something", (req, res) => {
    console.log("something!", process.pid);
    console.log("GET /something");
    res.send("Hey!");
});
app.post("/something", (req, res) => {
    console.log("POST /something");
    res.json(req.body);
});
gameServer.onShutdown(() => {
    console.log("CUSTOM SHUTDOWN ROUTINE: STARTED");
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("CUSTOM SHUTDOWN ROUTINE: FINISHED");
            resolve();
        }, 1000);
    });
});
process.on('unhandledRejection', r => console.log(r));
gameServer.listen(port);
console.log(`Listening on ws://${endpoint}:${port}`);
