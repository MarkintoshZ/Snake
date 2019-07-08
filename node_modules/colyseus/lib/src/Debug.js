"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = __importDefault(require("debug"));
exports.debugMatchMaking = debug_1.default('colyseus:matchmaking');
exports.debugPatch = debug_1.default('colyseus:patch');
exports.debugError = debug_1.default('colyseus:errors');
exports.debugAndPrintError = (...args) => {
    console.error(...args);
    exports.debugError.apply(exports.debugError, args);
};
