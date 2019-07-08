"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const benchmark_1 = __importDefault(require("benchmark"));
const notepack_io_1 = __importDefault(require("notepack.io"));
const fossil_delta_1 = __importDefault(require("fossil-delta"));
const mock_1 = require("../utils/mock");
const src_1 = require("../../src");
const Utils_1 = require("../../src/Utils");
const NUM_CLIENTS = 10;
const NUM_MONSTERS = 500;
const MAP_GRID_SIZE = 200;
const suite = new benchmark_1.default.Suite();
const room = new mock_1.DummyRoom();
room.roomName = "dummy";
room.roomId = src_1.generateId();
// build 200x200 map
const map = [];
for (var i = 0; i < MAP_GRID_SIZE; i++) {
    map[i] = [];
    for (var j = 0; j < MAP_GRID_SIZE; j++) {
        map[i].push((Math.random() > 0.5) ? 0 : 1);
    }
}
// build 500 monsters
let monsters = {};
for (let i = 0; i < NUM_MONSTERS; i++) {
    monsters[src_1.generateId()] = {
        x: Math.round(Math.random() * 200),
        y: Math.round(Math.random() * 200)
    };
}
// build 10 players
let players = {};
for (let i = 0; i < NUM_CLIENTS; i++) {
    let client = mock_1.createDummyClient();
    room._onJoin(client);
    players[client.id] = {
        x: Math.round(Math.random() * 200),
        y: Math.round(Math.random() * 200)
    };
}
function moveMonsters() {
    for (let id in monsters) {
        monsters[id].x += (Math.random() > 0.5) ? 1 : -1;
        monsters[id].y += (Math.random() > 0.5) ? 1 : -1;
    }
}
function movePlayers() {
    for (let id in players) {
        players[id].x += (Math.random() > 0.5) ? 1 : -1;
        players[id].y += (Math.random() > 0.5) ? 1 : -1;
    }
}
let state = { map, monsters, players };
let encodedState = notepack_io_1.default.encode(state);
let secondEncodedState = notepack_io_1.default.encode(state);
function distance(p1, p2) {
    let a = p1.x - p2.x;
    let b = p1.y - p2.y;
    return Math.sqrt(a * a + b * b);
}
room.setState(state);
// suite.add('toJSON', () => toJSON(state));
// suite.add('plain data', () => state);
//
// suite.add('encodedState.equals()', () => {
//   encodedState.equals(secondEncodedState);
// });
let previousState = notepack_io_1.default.encode(Utils_1.toJSON(state));
moveMonsters();
movePlayers();
let nextState = notepack_io_1.default.encode(Utils_1.toJSON(state));
let deltaData = fossil_delta_1.default.create(previousState, nextState);
// suite.add('fossilDelta.create()', () => {
//   fossilDelta.create(previousState, nextState);
// });
//
// suite.add('nodeDelta.create()', () => {
//   nodeDelta.create(previousState, nextState);
// });
//
// suite.add('msgpack.encode delta', () => {
//   msgpack.encode([Protocol.ROOM_STATE_PATCH, room.roomId, deltaData]);
// });
let numBytesPatches = 0;
suite.add('Room#broadcastPatch', function () {
    moveMonsters();
    movePlayers();
    room.broadcastPatch();
});
suite.on('cycle', e => console.log(e.target.toString()));
suite.run();
console.log("Done.");
process.exit();
