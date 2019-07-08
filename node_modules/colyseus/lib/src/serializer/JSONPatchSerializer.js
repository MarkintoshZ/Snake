"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fast_json_patch_1 = __importDefault(require("fast-json-patch"));
const Debug_1 = require("../Debug");
const Protocol_1 = require("../Protocol");
/**
 * This serializer is not meant to be used.
 * It just ilustrates how you can implement your own data serializer.
 */
class JSONPatchSerializer {
    constructor() {
        this.id = 'json-patch';
    }
    reset(newState) {
        this.state = newState;
        this.observer = fast_json_patch_1.default.observe(newState);
    }
    getFullState() {
        return JSON.stringify(this.state);
    }
    applyPatches(clients, newState) {
        const hasChanged = this.hasChanged(newState);
        if (hasChanged) {
            const patches = JSON.stringify(this.patches);
            let numClients = clients.length;
            while (numClients--) {
                const client = clients[numClients];
                Protocol_1.send[Protocol_1.Protocol.ROOM_STATE_PATCH](client, patches);
            }
        }
        return hasChanged;
    }
    hasChanged(newState) {
        this.patches = fast_json_patch_1.default.generate(this.observer);
        const changed = (this.patches.length > 0);
        if (changed) {
            //
            // debugging
            //
            if (Debug_1.debugPatch.enabled) {
                Debug_1.debugPatch('%d bytes, %j', this.patches.length, this.patches);
            }
            this.state = newState;
        }
        return changed;
    }
}
exports.JSONPatchSerializer = JSONPatchSerializer;
