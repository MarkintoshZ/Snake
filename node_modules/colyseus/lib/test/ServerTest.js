"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const notepack_io_1 = __importDefault(require("notepack.io"));
const Server_1 = require("../src/Server");
const Protocol_1 = require("../src/Protocol");
const mock_1 = require("./utils/mock");
const src_1 = require("../src");
describe('Server', () => {
    const server = new Server_1.Server({ port: 1111 });
    const matchMaker = server.matchMaker;
    let clients;
    // register dummy room
    server.register('room', mock_1.DummyRoom);
    server.register('invalid_room', mock_1.DummyRoom);
    server.register('room_async', mock_1.RoomWithAsync);
    // connect 5 clients into server
    beforeEach(() => {
        clients = [];
        for (var i = 0; i < 5; i++) {
            var client = mock_1.createEmptyClient();
            clients.push(client);
            server.onConnection(client, {});
        }
    });
    afterEach(() => {
        // disconnect dummy clients
        for (var i = 0, len = clients.length; i < len; i++) {
            clients[i].close();
        }
    });
    describe('join request', () => {
        it('should register client listeners when joined a room', () => __awaiter(this, void 0, void 0, function* () {
            const client0 = clients[0];
            const client1 = clients[1];
            client0.emit('message', notepack_io_1.default.encode([Protocol_1.Protocol.JOIN_REQUEST, "room", { requestId: 5 }]));
            client1.emit('message', notepack_io_1.default.encode([Protocol_1.Protocol.JOIN_REQUEST, "room", { requestId: 5 }]));
            yield mock_1.awaitForTimeout(100);
            assert_1.default.equal(client0.messages[1].readUInt8(0), Protocol_1.Protocol.JOIN_REQUEST);
            assert_1.default.equal(client0.messages[1].readUInt8(1), 5); // requestId
            assert_1.default.ok(src_1.isValidId(mock_1.utf8Read(client0.messages[1], 2)));
        }));
        it('should join a room with valid options', () => __awaiter(this, void 0, void 0, function* () {
            const client = clients[2];
            client.emit('message', notepack_io_1.default.encode([Protocol_1.Protocol.JOIN_REQUEST, "room", { requestId: 1 }]));
            yield mock_1.awaitForTimeout(100);
            assert_1.default.equal(client.messages[1].readUInt8(0), Protocol_1.Protocol.JOIN_REQUEST);
            assert_1.default.equal(client.messages[1].readUInt8(1), 1); // requestId
            assert_1.default.ok(src_1.isValidId(mock_1.utf8Read(client.messages[1], 2)));
        }));
        it('shouldn\'t join a non-existant room', () => __awaiter(this, void 0, void 0, function* () {
            const client = clients[3];
            client.emit('message', notepack_io_1.default.encode([Protocol_1.Protocol.JOIN_REQUEST, "non_existant_room", {}]));
            yield mock_1.awaitForTimeout(100);
            assert_1.default.equal(client.messages[1].readUInt8(0), Protocol_1.Protocol.JOIN_ERROR);
            assert_1.default.equal(mock_1.utf8Read(client.messages[1], 1), `no available handler for "non_existant_room"`);
        }));
        it('shouldn\'t join a room with invalid options', () => __awaiter(this, void 0, void 0, function* () {
            const client = clients[3];
            client.emit('message', notepack_io_1.default.encode([Protocol_1.Protocol.JOIN_REQUEST, "invalid_room", { invalid_param: 10 }]));
            yield mock_1.awaitForTimeout(100);
            assert_1.default.equal(client.messages[1].readUInt8(0), Protocol_1.Protocol.JOIN_ERROR);
            assert_1.default.ok(/^failed to auto-create room "invalid_room"/gi.test(mock_1.utf8Read(client.messages[1], 1)));
        }));
    });
    describe('matchmaking', () => {
        it('joining a room that is dispoing', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(10000);
                // connect first client
                const client1 = clients[0];
                client1.emit('message', notepack_io_1.default.encode([Protocol_1.Protocol.JOIN_REQUEST, "room_async", {}]));
                yield mock_1.awaitForTimeout(20);
                const roomId = mock_1.utf8Read(client1.messages[1], 1);
                const roomClient1 = mock_1.createEmptyClient();
                roomClient1.upgradeReq = { url: `ws://localhost:1111/${roomId}?colyseusid=${client1.id}` };
                let client1Success;
                yield server.verifyClient({ req: roomClient1.upgradeReq }, (success) => __awaiter(this, void 0, void 0, function* () {
                    client1Success = success;
                    server.onConnection(roomClient1);
                    yield mock_1.awaitForTimeout(20);
                    roomClient1.close();
                }));
                assert_1.default.ok(client1Success);
                // connect second client
                const client2 = clients[1];
                yield mock_1.awaitForTimeout(mock_1.RoomWithAsync.ASYNC_TIMEOUT + 20);
                client2.emit('message', notepack_io_1.default.encode([Protocol_1.Protocol.JOIN_REQUEST, "room_async", {}]));
                yield mock_1.awaitForTimeout(50);
                const roomId2 = mock_1.utf8Read(client2.messages[1], 1);
                const roomClient2 = mock_1.createEmptyClient();
                roomClient2.upgradeReq = { url: `ws://localhost:1111/${roomId2}?colyseusid=${client2.id}` };
                let client2Success;
                yield server.verifyClient({ req: roomClient2.upgradeReq }, (success) => __awaiter(this, void 0, void 0, function* () {
                    client2Success = success;
                    server.onConnection(roomClient2);
                    yield mock_1.awaitForTimeout(20);
                }));
                assert_1.default.ok(client2Success);
                yield mock_1.awaitForTimeout(500);
                assert_1.default.ok(true);
            });
        });
    });
});
