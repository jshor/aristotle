(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../base/InputNode", "../types/Connection", "../types/LogicValue"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const InputNode_1 = require("../base/InputNode");
    const Connection_1 = require("../types/Connection");
    const LogicValue_1 = require("../types/LogicValue");
    class Circuit {
        constructor() {
            /**
             * The debugger processing queue.
             *
             * @type {Array<CircuitNode>}
             */
            this.queue = [];
            /**
             * A list of all the nodes in the circuit.
             *
             * @type {Array<CircuitNode>}
             */
            this.nodes = [];
            /**
             * A list of all input nodes in the circuit.jest
             *
             * @type {Array<CircuitNode>}
             */
            this.inputs = [];
        }
        /**
         * Adds a node to the circuit and its appropriate queue(s).
         *
         * @param {CircuitNode} node - node to add
         */
        addNode(node) {
            if (node instanceof InputNode_1.default) {
                this.inputs.push(node);
                this.enqueue(node);
            }
            this.nodes.push(node);
        }
        /**
         * Removes a node from the circuit and its appropriate queue(s).
         *
         * @param {CircuitNode} node - node to remove
         */
        removeNode(node) {
            if (node instanceof InputNode_1.default) {
                this.inputs.splice(this.inputs.indexOf(node), 1);
                this.reset();
            }
            this.nodes.splice(this.nodes.indexOf(node), 1);
            this.removeNodeOutputs(node);
            this.next();
        }
        /**
         * Adds a connection entry from the source node to the target node on the given index.
         *
         * @param {CircuitNode} source - source node
         * @param {CircuitNode} target - target node
         * @param {Number} targetIndex - entry index on the target node for the connection
         */
        addConnection(source, target, targetIndex) {
            source.outputs.push(new Connection_1.default(target, targetIndex));
            source.value = LogicValue_1.default.UNKNOWN;
            this.enqueue(source);
            this.next();
        }
        /**
         * Removes the connection on the source node at the source index and the connection at its target node.
         * The input value at the target index will be reset to Hi-Z.
         *
         * @param {CircuitNode} sourceNode - source node to disconnect
         * @param {CircuitNode} targetNode - target node to disconnect
         */
        removeConnection(sourceNode, targetNode) {
            sourceNode
                .outputs
                .concat()
                .forEach(({ node, index }, i) => {
                if (targetNode === node) {
                    // reset the input of the target for this connection to hi-Z
                    targetNode.update(LogicValue_1.default.UNKNOWN, index);
                    // remove the output entry at the source
                    sourceNode.outputs.splice(i, 1);
                    // place the target node in the queue for processing
                    this.enqueue(sourceNode, targetNode);
                }
            });
            this.next();
        }
        /**
         * Removes all connections from the given source node.
         *
         * @param {CircuitNode} source
         */
        removeNodeOutputs(source) {
            for (let i = 0; i < source.outputs.length; i++) {
                this.removeConnection(source, source.outputs[i].node);
            }
        }
        /**
         * Appends the given node(s) to the processing queue.
         *
         * @param {...CircuitNode} added - node(s) to add to the queue
         */
        enqueue(...added) {
            added.forEach((node) => {
                if (!~this.queue.indexOf(node)) {
                    this.queue.push(node);
                }
            });
        }
        /**
         * Removes the given node from the processing queue.
         *
         * @param {CircuitNode} removed - node to remove from the queue
         */
        dequeue(removed) {
            const removedIndex = this.queue.indexOf(removed);
            if (~removedIndex) {
                this.queue.splice(removedIndex, 1);
            }
        }
        /**
         * Resets the circuit.
         */
        reset() {
            this.nodes.forEach((node) => node.reset());
        }
        /**
         * Advances the circuit simulation one step. If none of the node values have changed,
         * it continues stepping through until either a value changes or the queue is empty.
         */
        next() {
            let isValueChanged = false;
            this.queue.forEach((node) => {
                this.enqueue(...node.propagate());
                this.dequeue(node);
                if (node.isValueChanged) {
                    isValueChanged = true;
                    node.isValueChanged = false;
                }
            });
            if (!this.isComplete() && !isValueChanged) {
                // if the queue is not finished but no value in the circuit has changed, step again
                return this.next();
            }
        }
        /**
         * Returns true when the queue is finished processing.
         *
         * @returns {Boolean}
         */
        isComplete() {
            return this.queue.length === 0;
        }
        debug() {
            this.nodes.forEach(({ name, value, newValue }) => {
                console.log(`${name}:`, value, newValue);
            });
        }
    }
    exports.default = Circuit;
});
