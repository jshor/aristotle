(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./CircuitNode", "../types/LogicValue"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CircuitNode_1 = require("./CircuitNode");
    const LogicValue_1 = require("../types/LogicValue");
    class InputNode extends CircuitNode_1.default {
        constructor(name) {
            super(name);
            this.inputValues = [LogicValue_1.default.UNKNOWN];
        }
        /**
         * Updates the node's value to be static having the given value.
         *
         * @override CircuitNode.setValue
         * @param {LogicValue} value
         */
        setValue(value) {
            this.newValue = value;
            this.eval = () => value;
        }
        /**
         * Resets the node.
         *
         * @override CircuitNode.reset
         */
        reset() {
            // do nothing
        }
    }
    exports.default = InputNode;
});
