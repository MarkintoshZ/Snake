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
process.env.COLYSEUS_PRESENCE_TIMEOUT = 50;
const assert_1 = __importDefault(require("assert"));
const sinon_1 = __importDefault(require("sinon"));
const MatchMaker_1 = require("../src/MatchMaker");
const Room_1 = require("../src/Room");
const src_1 = require("../src");
const mock_1 = require("./utils/mock");
const Protocol_1 = require("../src/Protocol");
process.on('unhandledRejection', (reason, promise) => {
    console.log(reason, promise);
});
describe('MatchMaker', function () {
    let matchMaker;
    let clock;
    beforeEach(() => {
        matchMaker = new MatchMaker_1.MatchMaker();
        matchMaker.registerHandler('room', mock_1.DummyRoom);
        matchMaker.registerHandler('dummy_room', mock_1.DummyRoom);
        matchMaker.registerHandler('room_with_default_options', mock_1.DummyRoom, { level: 1 });
        matchMaker.registerHandler('room_verify_client', mock_1.RoomVerifyClient);
        matchMaker.registerHandler('room_verify_client_with_lock', mock_1.RoomVerifyClientWithLock);
        matchMaker.registerHandler('room_async', mock_1.RoomWithAsync);
        clock = sinon_1.default.useFakeTimers();
    });
    afterEach(() => clock.restore());
    describe('room handlers', function () {
        it('should add handler with name', function () {
            assert_1.default.ok(matchMaker.hasHandler('room'));
        });
        it('should create a new room ', () => __awaiter(this, void 0, void 0, function* () {
            let roomId = yield matchMaker.onJoinRoomRequest(mock_1.createDummyClient(), 'room', {}, true);
            let room = matchMaker.getRoomById(roomId);
            assert_1.default.ok(typeof (room.roomId) === "string");
            assert_1.default.ok(room instanceof Room_1.Room);
        }));
        it('onInit should receive client options as second argument when creating room', function () {
            const onInitStub = sinon_1.default.stub(mock_1.DummyRoom.prototype, 'onInit').returns(true);
            matchMaker.create('room_with_default_options', { map: "forest" });
            assert_1.default.deepEqual(onInitStub.getCall(0).args, [{ level: 1, map: "forest" }]);
            matchMaker.create('room_with_default_options', { level: 2 });
            assert_1.default.deepEqual(onInitStub.getCall(1).args, [{ level: 1 }], "shouldn't be possible to overwrite arguments");
            onInitStub.restore();
        });
        it('shouldn\'t return when trying to join with invalid room id', () => __awaiter(this, void 0, void 0, function* () {
            let roomId = yield matchMaker.joinById('invalid_id', {});
            assert_1.default.equal(roomId, undefined);
        }));
        it('shouldn\'t create room when requesting to join room with invalid params', () => __awaiter(this, void 0, void 0, function* () {
            const room = 'dummy_room';
            const joinRequestOptions = {
                invalid_param: 10,
            };
            try {
                yield matchMaker.onJoinRoomRequest(mock_1.createDummyClient(), room, joinRequestOptions);
                assert_1.default.fail("catch block should've taken place");
            }
            catch (e) {
                assert_1.default.equal(e.message, `Failed to auto-create room "${room}" during join request using options "${JSON.stringify(joinRequestOptions)}"`);
            }
        }));
        it('shouldn\t return room instance when trying to join existing room by id with invalid params', () => __awaiter(this, void 0, void 0, function* () {
            clock.restore();
            let roomId = yield matchMaker.onJoinRoomRequest(mock_1.createDummyClient(), 'room', {});
            assert_1.default.ok(src_1.isValidId(roomId));
            let joinByRoomId = yield matchMaker.joinById(roomId, { invalid_param: 1 });
            assert_1.default.equal(joinByRoomId, undefined);
        }));
        it('should join existing room using "joinById"', () => __awaiter(this, void 0, void 0, function* () {
            clock.restore();
            const client = mock_1.createDummyClient();
            let roomId = yield matchMaker.onJoinRoomRequest(client, 'room', {});
            assert_1.default.ok(src_1.isValidId(roomId));
            let joinByRoomId = yield matchMaker.joinById(roomId, {});
            assert_1.default.ok(src_1.isValidId(joinByRoomId));
            const roomClient = mock_1.createDummyClient();
            yield matchMaker.onJoinRoomRequest(roomClient, roomId, {});
            yield matchMaker.connectToRoom(roomClient, roomId);
            assert_1.default.ok(roomClient.sessionId, "should have valid sessionId");
        }));
        it('should call "onDispose" when room is not created', () => __awaiter(this, void 0, void 0, function* () {
            const stub = sinon_1.default.stub(mock_1.DummyRoom.prototype, 'requestJoin').returns(false);
            const spy = sinon_1.default.spy(mock_1.DummyRoom.prototype, 'onDispose');
            try {
                yield matchMaker.create('dummy_room', {});
                assert_1.default.fail("catch block should've taken place");
            }
            catch (e) {
                assert_1.default.equal(typeof (e.message), "string");
                assert_1.default.ok(spy.calledOnce);
                stub.restore();
                spy.restore();
            }
        }));
        it('should emit error if room name is not a valid id', () => __awaiter(this, void 0, void 0, function* () {
            const invalidRoomName = 'fjf10jf10jf0jf0fj';
            try {
                yield matchMaker.onJoinRoomRequest(mock_1.createDummyClient(), invalidRoomName, {});
            }
            catch (e) {
                assert_1.default.equal(e.message, `Failed to join invalid room "${invalidRoomName}"`);
            }
        }));
    });
    describe('onJoin', () => {
        it('should send error message to client when joining invalid room', () => __awaiter(this, void 0, void 0, function* () {
            let client = mock_1.createDummyClient({});
            clock.restore();
            try {
                yield matchMaker.connectToRoom(client, src_1.generateId());
                assert_1.default.fail("an error should be thrown here.");
            }
            catch (e) {
                assert_1.default.ok(e.message.match(/timed out/));
            }
        })).timeout(MatchMaker_1.REMOTE_ROOM_SHORT_TIMEOUT + 100);
    });
    // describe('verifyClient', () => {
    //   it('should\'t allow to connect when verifyClient returns false', (done) => {
    //     let client = createDummyClient();
    //     RoomVerifyClient.prototype.verifyClient = () => false;
    //     matchMaker.onJoinRoomRequest('room_verify_client', { clientId: client.id }, true, (err, room) => {
    //       matchMaker.bindClient(client, room.roomId).then((room) => {
    //         throw new Error("this promise shouldn't succeed");
    //       }).catch(err => {
    //         assert.ok(typeof (err) === "string");
    //         assert.equal(client.lastMessage[0], Protocol.JOIN_ERROR);
    //         done();
    //       });
    //     });
    //   });
    //   it('should\'t allow to connect when verifyClient returns a failed promise', (done) => {
    //     let client = createDummyClient();
    //     RoomVerifyClient.prototype.verifyClient = () => new Promise((resolve, reject) => {
    //       setTimeout(() => reject("forbidden"), 50);
    //     });
    //     matchMaker.onJoinRoomRequest('room_verify_client', { clientId: client.id }, true, (err, room) => {
    //       matchMaker.bindClient(client, room.roomId).then((room) => {
    //         throw new Error("this promise shouldn't succeed");
    //       }).catch(err => {
    //         assert.equal(err, "forbidden");
    //         assert.equal(client.lastMessage[0], Protocol.JOIN_ERROR);
    //         done();
    //       });
    //     });
    //   });
    //   it('should allow to connect when verifyClient returns true', (done) => {
    //     let client = createDummyClient();
    //     RoomVerifyClient.prototype.verifyClient = () => true;
    //     matchMaker.onJoinRoomRequest('room_verify_client', { clientId: client.id }, true, (err, room) => {
    //       matchMaker.bindClient(client, room.roomId).then((room) => {
    //         assert.ok(room instanceof Room);
    //         done();
    //       }).catch(err => {
    //         throw new Error(err);
    //       });
    //     });
    //   });
    //   it('should allow to connect when verifyClient returns fulfiled promise', (done) => {
    //     let client = createDummyClient();
    //     RoomVerifyClient.prototype.verifyClient = () => new Promise((resolve, reject) => {
    //       setTimeout(() => resolve(), 50);
    //     });
    //     matchMaker.onJoinRoomRequest('room_verify_client', { clientId: client.id }, true, (err, room) => {
    //       matchMaker.bindClient(client, room.roomId).then((room) => {
    //         assert.equal(1, room.clients.length);
    //         assert.ok(room instanceof Room);
    //         done();
    //       }).catch(err => {
    //         throw new Error(err);
    //       });
    //     });
    //   });
    //   it('should handle leaving room before onJoin is fulfiled.', (done) => {
    //     const onDisposeSpy = sinon.spy(RoomVerifyClient.prototype, 'onDispose');
    //     RoomVerifyClient.prototype.verifyClient = () => new Promise((resolve, reject) => {
    //       setTimeout(() => resolve(), 100);
    //     });
    //     let client = createDummyClient();
    //     matchMaker.onJoinRoomRequest('room_verify_client', { clientId: client.id }, true, (err, room) => {
    //       matchMaker.bindClient(client, room.roomId).then((room) => {
    //         throw new Error("this promise shouldn't succeed");
    //       }).catch(err => {
    //         assert.equal(0, room.clients.length);
    //         assert.deepEqual({}, matchMaker.sessions);
    //         assert.ok(onDisposeSpy.calledOnce);
    //         onDisposeSpy.restore();
    //         done();
    //       });
    //       client.emit('close');
    //     });
    //   });
    //   xit('shouldn\'t accept second client when room is locked after first one', (done) => {
    //     let client = createDummyClient();
    //     matchMaker.onJoinRoomRequest('room_verify_client_with_lock', { clientId: client.id }, true, (err, room) => {
    //       matchMaker.bindClient(client, room.roomId).then((room) => {
    //         assert.equal(1, room.clients.length);
    //         assert.ok(room instanceof Room);
    //       }).catch(err => {
    //         throw new Error("this promise shouldn't fail");
    //       });
    //     });
    //     // try to join with a second client when the room will be locked
    //     setTimeout(() => {
    //       let client = createDummyClient();
    //       matchMaker.onJoinRoomRequest('room_verify_client_with_lock', { clientId: client.id }, true, (err, room) => {
    //         matchMaker.bindClient(client, room.roomId).then((room) => {
    //           assert.equal(1, room.clients.length);
    //           assert.ok(room instanceof Room);
    //           done();
    //         }).catch(err => {
    //           throw new Error("this promise shouldn't fail");
    //         });
    //       });
    //     }, 10);
    //   });
    // });
    describe('registered handler events', () => {
        it('should trigger "create" event', (done) => {
            matchMaker.handlers["room"].on("create", (room) => {
                assert_1.default.ok(room instanceof Room_1.Room);
                done();
            });
            matchMaker.create('room', {});
        });
        it('should trigger "dispose" event', () => __awaiter(this, void 0, void 0, function* () {
            let dummyRoom = matchMaker.getRoomById(yield matchMaker.create('room', {}));
            matchMaker.handlers["room"].on("dispose", (room) => {
                assert_1.default.ok(room instanceof Room_1.Room);
            });
            dummyRoom.emit("dispose");
        }));
        it('should trigger "join" event', (done) => {
            let dummyRoom = matchMaker.getRoomById(matchMaker.create('room', {}));
            // TODO
            matchMaker.handlers["room"].on("join", (room, client) => {
                assert_1.default.ok(room instanceof Room_1.Room);
                assert_1.default.ok(client instanceof mock_1.Client);
                done();
            });
            let client = mock_1.createDummyClient();
            matchMaker.onJoinRoomRequest(client, 'room', {}).then((roomId) => {
                matchMaker.getRoomById(roomId)._onJoin(client, {});
            });
        });
        it('should trigger "lock" event', (done) => {
            matchMaker.handlers["room"].on("lock", (room) => done());
            matchMaker.handlers["room"].on("create", (room) => room.lock());
            matchMaker.create('room', {});
        });
        it('should trigger "unlock" event', (done) => {
            matchMaker.handlers["room"].on("unlock", (room) => done());
            matchMaker.handlers["room"].on("create", (room) => {
                room.lock();
                room.unlock();
            });
            matchMaker.create('room', {});
        });
        it('should\'nt trigger "unlock" if room hasn\'t been locked before', (done) => {
            clock.restore();
            matchMaker.handlers["room"].on("unlock", (room) => {
                throw new Error("shouldn't trigger 'unlock' event here");
            });
            matchMaker.handlers["room"].on("create", (room) => room.unlock());
            setTimeout(() => done(), 100);
            matchMaker.create('room', {});
        });
        it('should trigger "leave" event', (done) => {
            let dummyRoom = matchMaker.getRoomById(matchMaker.create('room', {}));
            matchMaker.handlers["room"].on("leave", (room, client) => {
                assert_1.default.ok(room instanceof Room_1.Room);
                assert_1.default.ok(client instanceof mock_1.Client);
                done();
            });
            let client = mock_1.createDummyClient();
            matchMaker.onJoinRoomRequest(client, 'room', { clientId: client.id }).then((roomId) => {
                let room = matchMaker.getRoomById(roomId);
                room._onJoin(client);
                room._onLeave(client);
            });
        });
    });
    describe("async callbacks", () => {
        it("shouldn't allow to join a room that's disposing asynchronously", () => __awaiter(this, void 0, void 0, function* () {
            const tick = (ms) => __awaiter(this, void 0, void 0, function* () { return clock.tick(ms); });
            const client = mock_1.createDummyClient({});
            const roomId = yield matchMaker.onJoinRoomRequest(client, 'room_async', {});
            const room = matchMaker.getRoomById(roomId);
            yield tick(room.seatReservationTime * 1000 - 1);
            assert_1.default(matchMaker.getRoomById(roomId) instanceof Room_1.Room);
            yield matchMaker.connectToRoom(client, roomId);
            yield tick(room.seatReservationTime * 1000);
            assert_1.default(matchMaker.getRoomById(roomId) instanceof Room_1.Room);
            client.close(Protocol_1.WS_CLOSE_CONSENTED);
            yield tick(mock_1.RoomWithAsync.ASYNC_TIMEOUT + 1);
            yield tick(mock_1.RoomWithAsync.ASYNC_TIMEOUT + 1);
            // WORKAROUND: each tick fulfils an internal promise
            yield tick(1);
            yield tick(1);
            yield tick(1);
            assert_1.default(!matchMaker.getRoomById(roomId));
        }));
    });
    describe("time between room creation and first connection", () => {
        it('should remove the room reference after a timeout without connection', () => __awaiter(this, void 0, void 0, function* () {
            const roomId = yield matchMaker.onJoinRoomRequest(mock_1.createDummyClient(), 'room', {});
            const dummyRoom = matchMaker.getRoomById(roomId);
            assert_1.default.equal(dummyRoom.clients, 0);
            assert_1.default(dummyRoom instanceof Room_1.Room);
            clock.tick(dummyRoom.seatReservationTime * 1000);
            assert_1.default(matchMaker.getRoomById(roomId) === undefined);
        }));
        it('timer should be re-set if second client tries to join the room', () => __awaiter(this, void 0, void 0, function* () {
            const roomId = yield matchMaker.onJoinRoomRequest(mock_1.createDummyClient(), 'room', {});
            const room = matchMaker.getRoomById(roomId);
            clock.tick(room.seatReservationTime * 1000 - 1);
            assert_1.default(room instanceof Room_1.Room);
            yield matchMaker.onJoinRoomRequest(mock_1.createDummyClient(), 'room', {});
            assert_1.default(matchMaker.getRoomById(roomId) instanceof Room_1.Room);
            clock.tick(room.seatReservationTime * 1000);
            assert_1.default(matchMaker.getRoomById(roomId) === undefined);
        }));
        it('room shouldn\'t be removed if a client has joined', () => __awaiter(this, void 0, void 0, function* () {
            const client = mock_1.createDummyClient({});
            const roomId = yield matchMaker.onJoinRoomRequest(client, 'room', {});
            const room = matchMaker.getRoomById(roomId);
            clock.tick(room.seatReservationTime * 1000 - 1);
            assert_1.default(room instanceof Room_1.Room);
            yield matchMaker.connectToRoom(client, roomId);
            clock.tick(room.seatReservationTime * 1000);
            assert_1.default(matchMaker.getRoomById(roomId) instanceof Room_1.Room);
        }));
    });
});
