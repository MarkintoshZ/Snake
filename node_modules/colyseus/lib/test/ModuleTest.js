"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const src_1 = __importDefault(require("../src"));
describe('Module', function () {
    describe('should expose Clock and Delayed', function () {
        assert_1.default.ok(src_1.default.Clock);
        assert_1.default.ok(src_1.default.Delayed);
    });
    describe('should expose generateId', function () {
        assert_1.default.ok(src_1.default.generateId);
    });
    describe('should expose @noync', function () {
        assert_1.default.ok(src_1.default.nosync);
    });
});
