(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../OutputNode", "../../types/LogicValue", "../CircuitNode"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const OutputNode_1 = require("../OutputNode");
    const LogicValue_1 = require("../../types/LogicValue");
    const CircuitNode_1 = require("../CircuitNode");
    describe('Output Node', () => {
        let node;
        beforeEach(() => {
            node = new OutputNode_1.default('testNode');
        });
        it('should extend CircuitNode', () => {
            expect(node).toBeInstanceOf(CircuitNode_1.default);
        });
        describe('update()', () => {
            it('should set the new value to the given one', () => {
                const value = LogicValue_1.default.FALSE;
                node.newValue = LogicValue_1.default.UNKNOWN;
                node.update(value);
                expect(node.newValue).toEqual(value);
            });
        });
    });
});
