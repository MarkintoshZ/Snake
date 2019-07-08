"use strict";
//
// This example shows how to use the "cluster" module with Colyseus.
//
// You must specify the `presence` option on Colyseus.Server when using multiple
// processes.
//
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const os_1 = __importDefault(require("os"));
const cluster_1 = __importDefault(require("cluster"));
const http_1 = __importDefault(require("http"));
const src_1 = __importDefault(require("../src"));
const ChatRoom_1 = require("./ChatRoom");
const port = Number(process.env.PORT || 2657);
const endpoint = "localhost";
if (cluster_1.default.isMaster) {
    // This only happens on the master server
    console.log("Starting master server.");
    console.log(`Running on Node.js ${process.version}.`);
    const cpus = os_1.default.cpus().length;
    for (let i = 0; i < cpus; ++i) {
        cluster_1.default.fork();
    }
}
else {
    // This happens on the slave processes.
    // We create a new game server and register the room.
    const gameServer = new src_1.default.Server({
        server: http_1.default.createServer(),
        presence: new src_1.default.MemsharedPresence()
    });
    gameServer.register("chat", ChatRoom_1.ChatRoom);
    gameServer.listen(port);
    console.log(`Listening on ws://${endpoint}:${port}`);
}
