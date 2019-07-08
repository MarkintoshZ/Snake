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
const memshared_1 = __importDefault(require("memshared"));
class MemsharedPresence {
    constructor() {
        this.subscriptions = {};
    }
    subscribe(topic, callback) {
        this.subscriptions[topic] = (message) => callback(message);
        memshared_1.default.subscribe(topic, this.subscriptions[topic]);
        return this;
    }
    unsubscribe(topic) {
        memshared_1.default.unsubscribe(topic, this.subscriptions[topic]);
        delete this.subscriptions[topic];
        return this;
    }
    publish(topic, data) {
        memshared_1.default.publish(topic, data);
    }
    exists(roomId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                memshared_1.default.pubsub(roomId, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data.length > 0);
                });
            });
        });
    }
    setex(key, value, seconds) {
        memshared_1.default.setex(key, seconds, value);
    }
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                memshared_1.default.get(key, (err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data);
                });
            });
        });
    }
    del(roomId) {
        memshared_1.default.del(roomId);
    }
    sadd(key, value) {
        memshared_1.default.sadd(key, value);
    }
    smembers(key) {
        return new Promise((resolve, reject) => {
            memshared_1.default.smembers(key, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
    srem(key, value) {
        memshared_1.default.srem(key, value);
    }
    scard(key) {
        return new Promise((resolve, reject) => {
            memshared_1.default.scard(key, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
    hset(roomId, key, value) {
        memshared_1.default.hset(roomId, key, value);
    }
    hget(roomId, key) {
        return new Promise((resolve, reject) => {
            memshared_1.default.hget(roomId, key, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
    hdel(roomId, key) {
        memshared_1.default.hdel(roomId, key);
    }
    hlen(roomId) {
        return new Promise((resolve, reject) => {
            memshared_1.default.hlen(roomId, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
    incr(key) {
        return new Promise((resolve, reject) => {
            memshared_1.default.incr(key, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
    decr(key) {
        return new Promise((resolve, reject) => {
            memshared_1.default.decr(key, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
}
exports.MemsharedPresence = MemsharedPresence;
