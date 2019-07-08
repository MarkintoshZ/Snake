"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const notepack_io_1 = __importDefault(require("notepack.io"));
const mock_1 = require("./utils/mock");
const LocalPresence_1 = require("./../src/presence/LocalPresence");
describe('Patch', function () {
    let room;
    beforeEach(function () {
        room = new mock_1.DummyRoom();
        room.presence = new LocalPresence_1.LocalPresence();
    });
    describe('patch interval', function () {
        let room = new mock_1.DummyRoomWithState();
        room.setPatchRate(1000 / 20);
        assert_1.default.equal("object", typeof (room._patchInterval));
        assert_1.default.equal(1000 / 20, room._patchInterval._idleTimeout, "should have patch rate set");
    });
    describe('simulation interval', function () {
        it('simulation shouldn\'t be initialized by default', function () {
            assert_1.default.equal(typeof (room._simulationInterval), "undefined");
        });
        it('allow setting simulation interval', function () {
            room.setSimulationInterval(() => { }, 1000 / 60);
            assert_1.default.equal("object", typeof (room._simulationInterval));
            assert_1.default.equal(1000 / 60, room._simulationInterval._idleTimeout);
        });
    });
    describe('#sendState', function () {
        it('should allow null and undefined values', function () {
            let room = new mock_1.DummyRoom();
            let client = mock_1.createDummyClient();
            room.setState({ n: null, u: undefined });
            room._onJoin(client, {});
            var state = notepack_io_1.default.decode(client.messages[2]);
            assert_1.default.deepEqual(state, { n: null, u: undefined });
        });
    });
});
