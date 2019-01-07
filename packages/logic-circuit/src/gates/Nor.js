(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./Or", "../types/LogicValue"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Or_1 = require("./Or");
    const LogicValue_1 = require("../types/LogicValue");
    class Nor extends Or_1.default {
        // protected eval (): number {
        //   switch (super.eval()) {
        //     case LogicValue.TRUE:
        //       return LogicValue.FALSE
        //     case LogicValue.FALSE:
        //       return LogicValue.TRUE
        //     default:
        //       return LogicValue.UNKNOWN
        //   }
        // }
        eval() {
            if (super.valueCount(LogicValue_1.default.TRUE)) {
                return LogicValue_1.default.FALSE;
            }
            if (super.valueCount(LogicValue_1.default.UNKNOWN)) {
                return LogicValue_1.default.UNKNOWN;
            }
            return LogicValue_1.default.TRUE;
        }
    }
    exports.default = Nor;
});
