(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./CircuitNode"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CircuitNode_1 = require("./CircuitNode");
    class OutputNode extends CircuitNode_1.default {
        /**
         * Updates the value of the node.
         *
         * @override CircuitNode.update
         * @param {LogicValue} value
         */
        update(value) {
            this.newValue = value;
        }
    }
    exports.default = OutputNode;
});
