(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../Or", "../../types/LogicValue"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Or_1 = require("../Or");
    const LogicValue_1 = require("../../types/LogicValue");
    describe('Or Gate', () => {
        let node;
        beforeEach(() => {
            node = new Or_1.default('testOr');
        });
        describe('eval()', () => {
            describe('when at least one Hi-Z value is present', () => {
                it('should return TRUE when one of the input values is TRUE', () => {
                    node.inputValues = [LogicValue_1.default.TRUE, LogicValue_1.default.UNKNOWN];
                    expect(node.eval()).toEqual(LogicValue_1.default.TRUE);
                });
                it('should return TRUE when multiple input values are TRUE', () => {
                    node.inputValues = [LogicValue_1.default.TRUE, LogicValue_1.default.TRUE, LogicValue_1.default.UNKNOWN];
                    expect(node.eval()).toEqual(LogicValue_1.default.TRUE);
                });
                it('should return Hi-Z when all input values are either FALSE or Hi-Z', () => {
                    node.inputValues = [LogicValue_1.default.FALSE, LogicValue_1.default.FALSE, LogicValue_1.default.UNKNOWN];
                    expect(node.eval()).toEqual(LogicValue_1.default.UNKNOWN);
                });
                it('should return Hi-Z when all input values are Hi-Z', () => {
                    node.inputValues = [LogicValue_1.default.UNKNOWN];
                    expect(node.eval()).toEqual(LogicValue_1.default.UNKNOWN);
                });
            });
            describe('when all values are binary', () => {
                it('should return TRUE when one of the input values is TRUE', () => {
                    node.inputValues = [LogicValue_1.default.TRUE, LogicValue_1.default.FALSE];
                    expect(node.eval()).toEqual(LogicValue_1.default.TRUE);
                });
                it('should return TRUE when multiple input values are TRUE', () => {
                    node.inputValues = [LogicValue_1.default.TRUE, LogicValue_1.default.TRUE, LogicValue_1.default.FALSE];
                    expect(node.eval()).toEqual(LogicValue_1.default.TRUE);
                });
                it('should return FALSE when all input values are FALSE', () => {
                    node.inputValues = [LogicValue_1.default.FALSE, LogicValue_1.default.FALSE];
                    expect(node.eval()).toEqual(LogicValue_1.default.FALSE);
                });
            });
        });
    });
});
