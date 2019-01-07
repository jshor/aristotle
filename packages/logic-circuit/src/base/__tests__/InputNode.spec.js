(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../InputNode", "../../types/LogicValue", "../CircuitNode"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const InputNode_1 = require("../InputNode");
    const LogicValue_1 = require("../../types/LogicValue");
    const CircuitNode_1 = require("../CircuitNode");
    describe('Input Node', () => {
        let node;
        beforeEach(() => {
            node = new InputNode_1.default('testNode');
        });
        it('should extend CircuitNode', () => {
            expect(node).toBeInstanceOf(CircuitNode_1.default);
        });
        describe('setValue()', () => {
            it('should set the new value to the given one', () => {
                const value = LogicValue_1.default.FALSE;
                node.newValue = LogicValue_1.default.UNKNOWN;
                node.setValue(value);
                expect(node.newValue).toEqual(value);
            });
            it('should set `eval()` to return the given value', () => {
                const value = LogicValue_1.default.FALSE;
                node.value = value;
                node.setValue(value);
                expect(node.eval()).toEqual(value);
            });
        });
    });
});
