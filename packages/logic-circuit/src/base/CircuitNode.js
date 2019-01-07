(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../types/LogicValue"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const LogicValue_1 = require("../types/LogicValue");
    class CircuitNode {
        /**
         * Constructor.
         *
         * @param {String} name - name of the node
         */
        constructor(name) {
            /**
             * Incoming values, to be used for calculation of the node's state.
             *
             * @type {Array<LogicValue>}
             */
            this.inputValues = [];
            /**
             * List of outgoing connections.
             *
             * @type {Array<Connection>}
             */
            this.outputs = [];
            /**
             * Flag for if the value of the node has changed since last circuit evaluation.
             *
             * @type {Boolean}
             */
            this.isValueChanged = false;
            /**
             * Current value of the node.
             *
             * @type {LogicValue}
             * @default LogicValue.UNKNOWN
             */
            this.value = LogicValue_1.default.UNKNOWN;
            /**
             * Next value for the node.
             *
             * @type {LogicValue}
             * @default LogicValue.UNKNOWN
             */
            this.newValue = LogicValue_1.default.UNKNOWN;
            /**
             * List of dictionaries containing event types and their respective callbacks.
             * Used for the invocation of event listeners when their respective events are fired.
             *
             * @type {Array<Object>}
             */
            this.events = [];
            this.name = name;
        }
        /**
         * Invokes the registered events having the given `eventType`.
         *
         * @param {String} eventType - 'change' or 'reset'
         * @param {LogicValue} value
         */
        invokeEvent(eventType, value) {
            this.events.forEach((event) => {
                if (event.eventType === eventType) {
                    event.callback(value);
                }
            });
        }
        /**
         * Evaluates the node. Default behavior returns the current value.
         *
         * @returns {LogicValue}
         */
        eval() {
            return this.value;
        }
        /**
         * Calculates how many input values equal the given comparison value.
         *
         * @param {LogicValue} compare - value to get count of
         * @returns {Number}
         */
        valueCount(compare) {
            return this
                .inputValues
                .filter((value) => value === compare)
                .length;
        }
        /**
         * Updates all outgoing connected nodes with the given value.
         *
         * @param {LogicValue} newValue - new value to output to the nodes
         */
        updateOutputs(newValue) {
            this.outputs.forEach(({ node, index }) => {
                node.update(newValue, index);
            });
        }
        /**
         * Updates the input value at the given index with the given value.
         *
         * @param {LogicValue} value - new value
         * @param {Number} index - source index
         */
        update(value, index) {
            this.inputValues[index] = value;
            this.newValue = this.eval();
        }
        /**
         * Propagates a signal, if the value of the node has changed.
         *
         * @returns {Array<CircuitNodes>} list of all outgoing connected nodes
         */
        propagate() {
            if (this.value !== this.newValue) {
                this.isValueChanged = true;
                this.value = this.newValue;
                this.updateOutputs(this.newValue);
                this.invokeEvent('change', this.newValue);
                return this.outputs.map(({ node }) => node);
            }
            return [];
        }
        /**
         * Resets the value and subsequent value of the node with Hi-Z.
         */
        reset() {
            this.value = LogicValue_1.default.UNKNOWN;
            this.newValue = LogicValue_1.default.UNKNOWN;
            this.invokeEvent('change', this.newValue);
        }
        /**
         * Registers an event listener.
         *
         * @param {String} eventType - 'change' or 'reset'
         * @param {Function} callback - method to invoke on event
         */
        on(eventType, callback) {
            this.events.push({ eventType, callback });
        }
    }
    exports.default = CircuitNode;
});
