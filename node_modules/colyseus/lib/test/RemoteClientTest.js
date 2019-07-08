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
const RedisPresence_1 = require("../src/presence/RedisPresence");
const RemoteClient_1 = require("../src/presence/RemoteClient");
const src_1 = require("../src");
describe('RemoteClient & RedisPresence', function () {
    let matchMaker1;
    let matchMaker2;
    let matchMaker3;
    function registerHandlers(matchMaker) {
        return __awaiter(this, void 0, void 0, function* () {
            yield matchMaker.registerHandler('room', mock_1.DummyRoom);
            yield matchMaker.registerHandler('room_two', mock_1.DummyRoom);
            yield matchMaker.registerHandler('room_three', mock_1.DummyRoom);
            yield matchMaker.registerHandler('dummy_room', mock_1.DummyRoom);
            yield matchMaker.registerHandler('room_async', mock_1.RoomWithAsync);
        });
    }
    function connectClientToRoom(matchMaker, client, roomName, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const roomId = yield matchMaker.onJoinRoomRequest(client, roomName, options);
            yield matchMaker.connectToRoom(client, roomId);
            return roomId;
        });
    }
    before(() => {
        // const redis = new RedisPresence();
        // redis.sub.flushdb();
    });
    after(function () {
        return __awaiter(this, void 0, void 0, function* () {
            this.timeout(1000);
            yield matchMaker1.gracefullyShutdown();
            yield matchMaker2.gracefullyShutdown();
            yield matchMaker3.gracefullyShutdown();
        });
    });
    beforeEach(function () {
        return __awaiter(this, void 0, void 0, function* () {
            matchMaker1 = new MatchMaker_1.MatchMaker(new RedisPresence_1.RedisPresence());
            matchMaker2 = new MatchMaker_1.MatchMaker(new RedisPresence_1.RedisPresence());
            matchMaker3 = new MatchMaker_1.MatchMaker(new RedisPresence_1.RedisPresence());
            yield registerHandlers(matchMaker1);
            yield registerHandlers(matchMaker2);
            yield registerHandlers(matchMaker3);
        });
    });
    // afterEach(() => clock.restore());
    describe("Inter-process communication", () => {
        it('should register RemoteClient on room owner\'s MatchMaker', () => __awaiter(this, void 0, void 0, function* () {
            const client1 = mock_1.createDummyClient();
            const roomId = yield connectClientToRoom(matchMaker1, client1, 'room');
            const room = matchMaker1.getRoomById(roomId);
            const client2 = mock_1.createDummyClient();
            yield connectClientToRoom(matchMaker2, client2, 'room');
            assert_1.default.ok(client1.sessionId);
            assert_1.default.ok(client2.sessionId);
            assert_1.default.equal(room.clients.length, 2);
            yield room.disconnect(); // cleanup data on RedisPresence
        }));
        it('should emit "close" event when RemoteClient disconnects', () => __awaiter(this, void 0, void 0, function* () {
            const client1 = mock_1.createDummyClient();
            const roomId = yield connectClientToRoom(matchMaker1, client1, 'room_two');
            const room = matchMaker1.getRoomById(roomId);
            const client2 = mock_1.createDummyClient();
            const client3 = mock_1.createDummyClient();
            const concurrentConnections = [
                connectClientToRoom(matchMaker2, client2, 'room_two'),
                connectClientToRoom(matchMaker2, client3, 'room_two')
            ];
            yield Promise.all(concurrentConnections);
            const remoteClients = room.clients.filter(client => client instanceof RemoteClient_1.RemoteClient);
            assert_1.default.equal(2, remoteClients.length);
            assert_1.default.ok(src_1.isValidId(client1.sessionId));
            assert_1.default.ok(src_1.isValidId(client2.sessionId));
            assert_1.default.ok(src_1.isValidId(client3.sessionId));
            client2.emit('close');
            client3.emit('close');
            yield mock_1.awaitForTimeout();
            assert_1.default.equal(room.clients.length, 1);
            client1.close();
            yield mock_1.awaitForTimeout(10);
            assert_1.default.ok(matchMaker1.getRoomById(roomId) === undefined);
        }));
        it('should be able to receive messages', () => __awaiter(this, void 0, void 0, function* () {
            const client1 = mock_1.createDummyClient();
            const roomId = yield connectClientToRoom(matchMaker1, client1, 'room_three');
            const room = matchMaker1.getRoomById(roomId);
            const client2 = mock_1.createDummyClient();
            const client3 = mock_1.createDummyClient();
            const client4 = mock_1.createDummyClient();
            const concurrentConnections = [
                connectClientToRoom(matchMaker2, client2, 'room_three'),
                connectClientToRoom(matchMaker2, client3, 'room_three'),
                connectClientToRoom(matchMaker3, client4, 'room_three')
            ];
            yield Promise.all(concurrentConnections);
            client1.receive(["SOMETHING"]);
            client2.receive(["SOMETHING"]);
            client3.receive(["SOMETHING"]);
            client4.receive(["SOMETHING"]);
            yield mock_1.awaitForTimeout(10);
            assert_1.default.equal(client1.lastMessage, "SOMETHING");
            assert_1.default.equal(client2.lastMessage, "SOMETHING");
            assert_1.default.equal(client3.lastMessage, "SOMETHING");
            assert_1.default.equal(client4.lastMessage, "SOMETHING");
            yield room.disconnect(); // cleanup data on RedisPresence
        }));
    });
});
