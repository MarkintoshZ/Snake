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
const MatchMaker_1 = require("../src/MatchMaker");
const mock_1 = require("./utils/mock");
process.on('unhandledRejection', (reason, promise) => {
    console.log(reason, promise);
});
describe('Presence', function () {
    let matchMaker;
    beforeEach(() => {
        matchMaker = new MatchMaker_1.MatchMaker();
        matchMaker.registerHandler('room', mock_1.DummyRoom);
        matchMaker.registerHandler('dummy_room', mock_1.DummyRoom);
        matchMaker.registerHandler('room_with_default_options', mock_1.DummyRoom, { level: 1 });
        matchMaker.registerHandler('room_verify_client', mock_1.RoomVerifyClient);
        matchMaker.registerHandler('room_verify_client_with_lock', mock_1.RoomVerifyClientWithLock);
    });
    describe('reserved seat', () => {
        it('should remove reserved seat after joining the room', () => __awaiter(this, void 0, void 0, function* () {
            const client = mock_1.createDummyClient({});
            const roomId = yield matchMaker.onJoinRoomRequest(client, 'room', {});
            yield matchMaker.connectToRoom(client, roomId);
            assert_1.default.equal(yield matchMaker.presence.hget(roomId, client.sessionId), undefined);
        }));
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
});
