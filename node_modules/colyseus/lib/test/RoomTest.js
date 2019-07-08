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
const sinon_1 = __importDefault(require("sinon"));
const ws_1 = __importDefault(require("ws"));
const MatchMaker_1 = require("./../src/MatchMaker");
const Protocol_1 = require("../src/Protocol");
const mock_1 = require("./utils/mock");
const src_1 = require("../src");
describe('Room', function () {
    let clock;
    let tick;
    beforeEach(() => {
        clock = sinon_1.default.useFakeTimers();
        tick = (ms) => __awaiter(this, void 0, void 0, function* () { return clock.tick(ms); });
    });
    afterEach(() => clock.restore());
    describe('#constructor', function () {
        it('should instantiate with valid options', function () {
            var room = new mock_1.DummyRoom();
            assert_1.default.ok(room instanceof mock_1.DummyRoom);
        });
    });
    describe('#onJoin/#onLeave', function () {
        it('should receive onJoin messages', function () {
            var room = new mock_1.DummyRoom();
            var client = mock_1.createDummyClient();
            var message = null;
            room._onJoin(client, {});
            assert_1.default.equal(client.messages.length, 1);
            assert_1.default.equal(client.messages[0].readUInt8(0), Protocol_1.Protocol.JOIN_ROOM);
        });
        it('should receive JOIN_ROOM and ROOM_STATE messages onJoin', function () {
            const room = new mock_1.DummyRoomWithState();
            const client = mock_1.createDummyClient();
            room._onJoin(client, {});
            assert_1.default.equal(client.messages.length, 3);
            assert_1.default.equal(client.messages[0].readUInt8(0), Protocol_1.Protocol.JOIN_ROOM);
            assert_1.default.equal(client.messages[1].readUInt8(0), Protocol_1.Protocol.ROOM_STATE);
        });
        it('should close client connection only after onLeave has fulfiled', function (done) {
            clock.restore();
            const room = new mock_1.RoomWithAsync();
            const client = mock_1.createDummyClient();
            room._onJoin(client);
            room._onMessage(client, notepack_io_1.default.encode([Protocol_1.Protocol.LEAVE_ROOM]));
            assert_1.default.equal(client.messages[0].readUInt8(0), Protocol_1.Protocol.JOIN_ROOM);
            assert_1.default.equal(client.readyState, ws_1.default.OPEN);
            room.on('disconnect', () => {
                assert_1.default.equal(client.readyState, ws_1.default.CLOSED);
                done();
            });
        });
        it('should cleanup/dispose when all clients disconnect', function (done) {
            const room = new mock_1.DummyRoom();
            const client = mock_1.createDummyClient();
            room._onJoin(client);
            assert_1.default.ok(room._patchInterval !== undefined);
            room.on('dispose', function () {
                ;
                assert_1.default.ok(room._patchInterval === undefined);
                done();
            });
            room._onLeave(client);
        });
    });
    describe('patch interval', function () {
        it('should set default "patch" interval', function () {
            var room = new mock_1.DummyRoom();
            assert_1.default.equal("object", typeof (room._patchInterval));
            assert_1.default.equal(1000 / 20, room.patchRate, "default patch rate should be 20");
        });
        it('should disable "patch" interval', function () {
            var room = new mock_1.DummyRoom();
            room.setPatchRate(null);
            assert_1.default.equal(undefined, room._patchInterval, "patch rate should be disabled");
        });
    });
    describe('#sendState', function () {
        it('should send state when it is set up', function () {
            let room = new mock_1.DummyRoom();
            let client = mock_1.createDummyClient();
            room._onJoin(client, {});
            room.setState({ success: true });
            // first message
            room.sendState(client);
            assert_1.default.equal(client.messages[1].readUInt8(0), Protocol_1.Protocol.ROOM_STATE);
            assert_1.default.deepEqual(notepack_io_1.default.decode(client.messages[2]), { success: true });
        });
    });
    describe('#broadcast', function () {
        it('should broadcast data to all clients', function () {
            let room = new mock_1.DummyRoom();
            // connect 3 dummy clients into room
            let client1 = mock_1.createDummyClient();
            room._onJoin(client1, {});
            let client2 = mock_1.createDummyClient();
            room._onJoin(client2, {});
            let client3 = mock_1.createDummyClient();
            room._onJoin(client3, {});
            room.broadcast("data");
            assert_1.default.equal(Protocol_1.Protocol.ROOM_DATA, client1.messages[1].readUInt8(0));
            assert_1.default.equal("data", client1.lastMessage);
            assert_1.default.equal("data", client2.lastMessage);
            assert_1.default.equal("data", client3.lastMessage);
        });
        it('should broadcast data to all clients, except the provided client', function () {
            let room = new mock_1.DummyRoom();
            // connect 2 dummy clients into room
            let client1 = mock_1.createDummyClient();
            room._onJoin(client1, {});
            let client2 = mock_1.createDummyClient();
            room._onJoin(client2, {});
            let client3 = mock_1.createDummyClient();
            room._onJoin(client3, {});
            room.broadcast("data", { except: client3 });
            assert_1.default.equal(3, client1.messages.length);
            assert_1.default.equal(3, client2.messages.length);
            assert_1.default.equal(1, client3.messages.length);
            assert_1.default.equal("data", client1.lastMessage);
            assert_1.default.equal("data", client2.lastMessage);
        });
        it('should broadcast after next patch', function () {
            const room = new mock_1.DummyRoom();
            // connect 3 dummy clients into room
            const client1 = mock_1.createDummyClient();
            room._onJoin(client1, {});
            const client2 = mock_1.createDummyClient();
            room._onJoin(client2, {});
            const client3 = mock_1.createDummyClient();
            room._onJoin(client3, {});
            room.broadcast("data", { afterNextPatch: true });
            assert_1.default.equal(1, client1.messages.length);
            assert_1.default.equal(1, client2.messages.length);
            assert_1.default.equal(1, client3.messages.length);
            tick(room.patchRate);
            assert_1.default.equal(3, client1.messages.length);
            assert_1.default.equal(3, client2.messages.length);
            assert_1.default.equal(3, client3.messages.length);
            assert_1.default.equal("data", client1.lastMessage);
            assert_1.default.equal("data", client2.lastMessage);
            assert_1.default.equal("data", client3.lastMessage);
        });
    });
    describe('#broadcastPatch', function () {
        it('should fail to broadcast patch without state', function () {
            let room = new mock_1.DummyRoom();
            // connect 2 dummy clients into room
            let client1 = mock_1.createDummyClient();
            room._onJoin(client1, {});
            let client2 = mock_1.createDummyClient();
            room._onJoin(client2, {});
            assert_1.default.equal(undefined, room.state);
            assert_1.default.equal(false, room.broadcastPatch());
        });
        it('should broadcast patch having state', function () {
            let room = new mock_1.DummyRoom();
            // connect 2 dummy clients into room
            let client1 = mock_1.createDummyClient();
            room._onJoin(client1, {});
            let client2 = mock_1.createDummyClient();
            room._onJoin(client2, {});
            // set state
            room.setState({ one: 1 });
            assert_1.default.deepEqual({ one: 1 }, room.state);
            // clean state. no patches available!
            assert_1.default.equal(false, room.broadcastPatch());
            // change the state to make patch available
            room.state.one = 111;
            // voila!
            assert_1.default.equal(true, room.broadcastPatch());
        });
        it('shouldn\'t broadcast clean state (no patches)', function () {
            var room = new mock_1.DummyRoom();
            room.setState({ one: 1 });
            // create 2 dummy connections with the room
            var client = mock_1.createDummyClient();
            room._onJoin(client, {});
            var client2 = mock_1.createDummyClient();
            room._onJoin(client2, {});
            assert_1.default.deepEqual({ one: 1 }, room.state);
            // clean state. no patches available!
            assert_1.default.equal(false, room.broadcastPatch());
            // change the state to make patch available
            room.state.two = 2;
            assert_1.default.deepEqual({ one: 1, two: 2 }, room.state);
            // voila!
            assert_1.default.equal(true, room.broadcastPatch());
            assert_1.default.equal(client.messages.length, 5);
            assert_1.default.equal(client2.messages.length, 5);
            // first message, join room
            var message = client.messages[0].readUInt8(0);
            assert_1.default.equal(message, Protocol_1.Protocol.JOIN_ROOM);
            // second message, room state
            var message = client.messages[1].readUInt8(0);
            assert_1.default.equal(message, Protocol_1.Protocol.ROOM_STATE);
            // third message, empty patch state
            var message = client.messages[3].readUInt8(0);
            assert_1.default.equal(message, Protocol_1.Protocol.ROOM_STATE_PATCH);
            assert_1.default.deepEqual(client.messages[4].length, 22);
            assert_1.default.deepEqual(client.messages[4], [66, 10, 66, 58, 130, 163, 111, 110, 101, 1, 163, 116, 119, 111, 2, 49, 86, 53, 49, 74, 89, 59]);
        });
    });
    describe("#disconnect", () => {
        it("should disconnect all clients", () => {
            let room = new mock_1.DummyRoom();
            // connect 10 clients
            let lastClient;
            for (var i = 0, len = 10; i < len; i++) {
                lastClient = mock_1.createDummyClient();
                room._onJoin(lastClient, {});
            }
            assert_1.default.equal(lastClient.messages[0].readUInt8(0), Protocol_1.Protocol.JOIN_ROOM);
            room.disconnect();
            assert_1.default.deepEqual(room.clients, {});
        });
        it("should allow asynchronous disconnects", (done) => {
            let room = new mock_1.DummyRoom();
            // connect 10 clients
            let client1 = mock_1.createDummyClient();
            room._onJoin(client1, {});
            let client2 = mock_1.createDummyClient();
            room._onJoin(client2, {});
            let client3 = mock_1.createDummyClient();
            room._onJoin(client3, {});
            // force asynchronous
            setTimeout(() => room._onLeave(client1, true), 1);
            setTimeout(() => {
                assert_1.default.doesNotThrow(() => room.disconnect());
            }, 1);
            setTimeout(() => room._onLeave(client2, true), 1);
            setTimeout(() => room._onLeave(client3, true), 1);
            // fulfil the test
            clock.tick(1);
            done();
        });
    });
    describe("#allowReconnection", () => {
        const matchMaker = new MatchMaker_1.MatchMaker();
        matchMaker.registerHandler('reconnect', mock_1.DummyRoom);
        it("should fail waiting same sessionId for reconnection", function (done) {
            // do not use fake timers along with async/await internal functions
            clock.restore();
            this.timeout(2500);
            const client = mock_1.createDummyClient();
            matchMaker.onJoinRoomRequest(client, 'reconnect', {}).
                then((roomId) => {
                const room = matchMaker.getRoomById(roomId);
                room.onLeave = function (client) {
                    this.allowReconnection(client, 2).then(() => {
                        assert_1.default.fail("this block shouldn't have been reached.");
                    }).catch((e) => {
                        assert_1.default.ok(!matchMaker.getRoomById(roomId), "room should be disposed after failed allowReconnection");
                        done();
                    });
                };
                matchMaker.connectToRoom(client, roomId).
                    then(() => {
                    assert_1.default.equal(room.clients.length, 1);
                    client.emit("close");
                    assert_1.default.equal(room.clients.length, 0);
                });
            });
        });
        it("should succeed waiting same sessionId for reconnection", () => __awaiter(this, void 0, void 0, function* () {
            const clientId = src_1.generateId();
            const firstClient = mock_1.createDummyClient({ id: clientId });
            const roomId = yield matchMaker.onJoinRoomRequest(firstClient, 'reconnect', {});
            const room = matchMaker.getRoomById(roomId);
            const reconnectionSpy = sinon_1.default.spy();
            room.onLeave = function (client) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const reconnectionClient = yield this.allowReconnection(client, 10);
                        assert_1.default.equal(client.sessionId, reconnectionClient.sessionId);
                        reconnectionSpy();
                    }
                    catch (e) {
                        assert_1.default.fail("catch block shouldn't be called here.");
                    }
                });
            };
            yield matchMaker.connectToRoom(firstClient, roomId);
            assert_1.default.equal(room.clients.length, 1);
            firstClient.emit("close");
            assert_1.default.equal(room.clients.length, 0);
            yield tick(5 * 1000);
            const secondClient = mock_1.createDummyClient({ id: clientId });
            const secondRoomId = yield matchMaker.onJoinRoomRequest(secondClient, 'reconnect', {
                sessionId: firstClient.sessionId
            });
            assert_1.default.equal(roomId, secondRoomId);
            yield matchMaker.connectToRoom(secondClient, roomId);
            assert_1.default.equal(secondClient.sessionId, firstClient.sessionId);
            // force async functions to be called along with fake timers
            yield tick(1);
            yield tick(1);
            sinon_1.default.assert.calledOnce(reconnectionSpy);
        }));
    });
});
