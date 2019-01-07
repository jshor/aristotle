(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../base/CircuitNode", "../types/LogicValue"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CircuitNode_1 = require("../base/CircuitNode");
    const LogicValue_1 = require("../types/LogicValue");
    class Or extends CircuitNode_1.default {
        constructor() {
            super(...arguments);
            this.inputValues = [LogicValue_1.default.UNKNOWN, LogicValue_1.default.UNKNOWN];
        }
        eval() {
            if (super.valueCount(LogicValue_1.default.TRUE)) {
                return LogicValue_1.default.TRUE;
            }
            if (super.valueCount(LogicValue_1.default.UNKNOWN)) {
                return LogicValue_1.default.UNKNOWN;
            }
            return LogicValue_1.default.FALSE;
        }
    }
    exports.default = Or;
});
