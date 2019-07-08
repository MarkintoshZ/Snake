"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
//
// Monkey-patch Colyseus' default behaviour
//
const colyseus_1 = require("colyseus");
colyseus_1.Room.prototype.getRoomListData = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const stateSize = (this._previousStateEncoded && this._previousStateEncoded.byteLength) || 0;
        const elapsedTime = this.clock.elapsedTime;
        const locked = this.locked;
        const data = yield this.getAvailableData();
        return Object.assign({}, data, { locked, elapsedTime, stateSize });
    });
};
colyseus_1.Room.prototype.getInspectData = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const state = this.state;
        const stateSize = (this._previousStateEncoded && this._previousStateEncoded.byteLength) || 0;
        const data = yield this.getAvailableData();
        const clients = this.clients.map((client) => ({ id: client.id, sessionId: client.sessionId }));
        const locked = this.locked;
        return Object.assign({}, data, { locked, clients, state, stateSize });
    });
};
// Actions
colyseus_1.Room.prototype._forceClientDisconnect = function (sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i].sessionId === sessionId) {
                this.clients[i].close();
                break;
            }
        }
    });
};
colyseus_1.Room.prototype._sendMessageToClient = function (sessionId, data) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i].sessionId === sessionId) {
                this.send(this.clients[i], data);
                break;
            }
        }
    });
};
