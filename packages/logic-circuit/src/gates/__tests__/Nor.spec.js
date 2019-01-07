(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../Nor", "../../types/LogicValue"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Nor_1 = require("../Nor");
    const LogicValue_1 = require("../../types/LogicValue");
    describe('Nor Gate', () => {
        let node;
        beforeEach(() => {
            node = new Nor_1.default('testNor');
        });
        describe('eval()', () => {
            describe('when at least one Hi-Z value is present', () => {
                it('should return FALSE when one of the input values is TRUE', () => {
                    node.inputValues = [LogicValue_1.default.TRUE, LogicValue_1.default.UNKNOWN];
                    expect(node.eval()).toEqual(LogicValue_1.default.FALSE);
                });
                it('should return FALSE when multiple input values are TRUE', () => {
                    node.inputValues = [LogicValue_1.default.TRUE, LogicValue_1.default.TRUE, LogicValue_1.default.UNKNOWN];
                    expect(node.eval()).toEqual(LogicValue_1.default.FALSE);
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
                it('should return FALSE when one of the input values is TRUE', () => {
                    node.inputValues = [LogicValue_1.default.TRUE, LogicValue_1.default.FALSE];
                    expect(node.eval()).toEqual(LogicValue_1.default.FALSE);
                });
                it('should return FALSE when multiple input values are TRUE', () => {
                    node.inputValues = [LogicValue_1.default.TRUE, LogicValue_1.default.TRUE, LogicValue_1.default.FALSE];
                    expect(node.eval()).toEqual(LogicValue_1.default.FALSE);
                });
                it('should return TRUE when all input values are FALSE', () => {
                    node.inputValues = [LogicValue_1.default.FALSE, LogicValue_1.default.FALSE];
                    expect(node.eval()).toEqual(LogicValue_1.default.TRUE);
                });
            });
        });
    });
});
