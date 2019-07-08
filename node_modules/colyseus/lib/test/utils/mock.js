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
const notepack_io_1 = __importDefault(require("notepack.io"));
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const src_1 = require("../../src");
const Room_1 = require("../../src/Room");
const LocalPresence_1 = require("./../../src/presence/LocalPresence");
class Client extends events_1.EventEmitter {
    constructor(id) {
        super();
        this.messages = [];
        this.readyState = ws_1.default.OPEN;
        this.id = id || null;
        this.once('close', () => {
            this.readyState = ws_1.default.CLOSED;
        });
    }
    send(message) {
        this.messages.push(message);
    }
    receive(message) {
        this.emit('message', notepack_io_1.default.encode(message));
    }
    getMessageAt(index) {
        return notepack_io_1.default.decode(this.messages[index]);
    }
    get lastMessage() {
        return this.getMessageAt(this.messages.length - 1);
    }
    close(code) {
        this.readyState = ws_1.default.CLOSED;
        this.emit('close');
    }
}
exports.Client = Client;
function createEmptyClient() {
    return new Client();
}
exports.createEmptyClient = createEmptyClient;
function createDummyClient(options = {}) {
    const id = options.id || src_1.generateId();
    delete options.id;
    let client = new Client(id);
    client.options = options;
    return client;
}
exports.createDummyClient = createDummyClient;
function awaitForTimeout(ms = 200) {
    return new Promise((resolve, reject) => setTimeout(resolve, ms));
}
exports.awaitForTimeout = awaitForTimeout;
class DummyRoom extends Room_1.Room {
    constructor() {
        super(new LocalPresence_1.LocalPresence());
    }
    requestJoin(options) {
        return !options.invalid_param;
    }
    onInit() { this.setState({}); }
    onDispose() { }
    onJoin() { }
    onLeave() { }
    onMessage(client, message) { this.broadcast(message); }
}
exports.DummyRoom = DummyRoom;
class RoomWithError extends Room_1.Room {
    constructor() {
        super(new LocalPresence_1.LocalPresence());
    }
    onInit() { this.setState({}); }
    onDispose() { }
    onJoin() {
        this.iHaveAnError();
    }
    onLeave() { }
    onMessage() { }
}
exports.RoomWithError = RoomWithError;
class DummyRoomWithState extends Room_1.Room {
    constructor() {
        super(new LocalPresence_1.LocalPresence());
        this.setState({ number: 10 });
    }
    requestJoin(options) {
        return !options.invalid_param;
    }
    onInit() { }
    onDispose() { }
    onJoin() { }
    onLeave() { }
    onMessage() { }
}
exports.DummyRoomWithState = DummyRoomWithState;
class RoomVerifyClient extends DummyRoom {
    constructor() {
        super(...arguments);
        this.patchRate = 5000;
    }
    onJoin() { }
}
exports.RoomVerifyClient = RoomVerifyClient;
class RoomWithAsync extends DummyRoom {
    constructor() {
        super(...arguments);
        this.maxClients = 1;
    }
    onAuth() {
        return __awaiter(this, void 0, void 0, function* () {
            yield awaitForTimeout(RoomWithAsync.ASYNC_TIMEOUT);
            return true;
        });
    }
    onJoin() { }
    onLeave() {
        return __awaiter(this, void 0, void 0, function* () {
            yield awaitForTimeout(RoomWithAsync.ASYNC_TIMEOUT);
        });
    }
    onDispose() {
        return __awaiter(this, void 0, void 0, function* () {
            yield awaitForTimeout(RoomWithAsync.ASYNC_TIMEOUT);
        });
    }
}
RoomWithAsync.ASYNC_TIMEOUT = 200;
exports.RoomWithAsync = RoomWithAsync;
class RoomVerifyClientWithLock extends DummyRoom {
    constructor() {
        super(...arguments);
        this.patchRate = 5000;
    }
    verifyClient() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                setTimeout(() => resolve(true), 100);
            });
        });
    }
    onJoin() {
        this.lock();
    }
}
exports.RoomVerifyClientWithLock = RoomVerifyClientWithLock;
function utf8Read(buff, offset) {
    const length = buff.readUInt8(offset++);
    var string = '', chr = 0;
    for (var i = offset, end = offset + length; i < end; i++) {
        var byte = buff.readUInt8(i);
        if ((byte & 0x80) === 0x00) {
            string += String.fromCharCode(byte);
            continue;
        }
        if ((byte & 0xe0) === 0xc0) {
            string += String.fromCharCode(((byte & 0x1f) << 6) |
                (buff.readUInt8(++i) & 0x3f));
            continue;
        }
        if ((byte & 0xf0) === 0xe0) {
            string += String.fromCharCode(((byte & 0x0f) << 12) |
                ((buff.readUInt8(++i) & 0x3f) << 6) |
                ((buff.readUInt8(++i) & 0x3f) << 0));
            continue;
        }
        if ((byte & 0xf8) === 0xf0) {
            chr = ((byte & 0x07) << 18) |
                ((buff.readUInt8(++i) & 0x3f) << 12) |
                ((buff.readUInt8(++i) & 0x3f) << 6) |
                ((buff.readUInt8(++i) & 0x3f) << 0);
            if (chr >= 0x010000) { // surrogate pair
                chr -= 0x010000;
                string += String.fromCharCode((chr >>> 10) + 0xD800, (chr & 0x3FF) + 0xDC00);
            }
            else {
                string += String.fromCharCode(chr);
            }
            continue;
        }
        throw new Error('Invalid byte ' + byte.toString(16));
    }
    return string;
}
exports.utf8Read = utf8Read;
