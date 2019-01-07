(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "../CircuitNode", "../../types/LogicValue", "../../types/Connection"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const CircuitNode_1 = require("../CircuitNode");
    const LogicValue_1 = require("../../types/LogicValue");
    const Connection_1 = require("../../types/Connection");
    describe('Circuit Node', () => {
        const name = 'testCircuitNode';
        let node;
        beforeEach(() => {
            node = new CircuitNode_1.default(name);
        });
        afterEach(() => jest.resetAllMocks());
        it('should set the name to the one passed into the constructor', () => {
            expect(node.name).toEqual(name);
        });
        describe('protected members', () => {
            class CircuitNodeTest extends CircuitNode_1.default {
                constructor(name) {
                    super(name);
                }
                invokeEvent(eventName, value) {
                    super.invokeEvent(eventName, value);
                }
                eval() {
                    return super.eval();
                }
                valueCount(compare) {
                    return super.valueCount(compare);
                }
            }
            beforeEach(() => {
                node = new CircuitNodeTest(name);
            });
            describe('eval()', () => {
                it('should, by default, only return the node\'s value', () => {
                    expect(node.eval()).toEqual(node.value);
                });
            });
            describe('invokeEvent()', () => {
                const eventFn1 = jest.fn();
                const eventFn2 = jest.fn();
                const eventFn3 = jest.fn();
                const newValue = LogicValue_1.default.TRUE;
                beforeEach(() => {
                    node.events = [
                        { eventType: 'change', callback: eventFn1 },
                        { eventType: 'reset', callback: eventFn2 },
                        { eventType: 'change', callback: eventFn3 }
                    ];
                });
                it('should call only the \'change\' eventType callbacks', () => {
                    node.invokeEvent('change', newValue);
                    expect(eventFn2).not.toHaveBeenCalled();
                    expect(eventFn1).toHaveBeenCalledTimes(1);
                    expect(eventFn1).toHaveBeenCalledWith(newValue);
                    expect(eventFn3).toHaveBeenCalledTimes(1);
                    expect(eventFn3).toHaveBeenCalledWith(newValue);
                });
                it('should call only the \'reset\' eventType callbacks', () => {
                    node.invokeEvent('reset', newValue);
                    expect(eventFn1).not.toHaveBeenCalled();
                    expect(eventFn3).not.toHaveBeenCalled();
                    expect(eventFn2).toHaveBeenCalledTimes(1);
                    expect(eventFn2).toHaveBeenCalledWith(newValue);
                });
            });
            describe('valueCount()', () => {
                it('should return 2 for two present TRUE logic values', () => {
                    node.inputValues = [LogicValue_1.default.FALSE, LogicValue_1.default.TRUE, LogicValue_1.default.TRUE];
                    expect(node.valueCount(LogicValue_1.default.TRUE)).toEqual(2);
                });
                it('should return 0 for no present FALSE logic values', () => {
                    node.inputValues = [LogicValue_1.default.UNKNOWN, LogicValue_1.default.TRUE, LogicValue_1.default.TRUE];
                    expect(node.valueCount(LogicValue_1.default.FALSE)).toEqual(0);
                });
            });
        });
        describe('updateOutputs()', () => {
            const output1 = new CircuitNode_1.default('test1');
            const output2 = new CircuitNode_1.default('test2');
            beforeEach(() => {
                jest
                    .spyOn(output1, 'update')
                    .mockImplementation(jest.fn());
                jest
                    .spyOn(output2, 'update')
                    .mockImplementation(jest.fn());
                node.outputs = [
                    new Connection_1.default(output1, 0),
                    new Connection_1.default(output2, 0)
                ];
            });
            it('should call `update()` with the given value on each output node', () => {
                const newValue = LogicValue_1.default.TRUE;
                node.updateOutputs(newValue);
                expect(output1.update).toHaveBeenCalledTimes(1);
                expect(output1.update).toHaveBeenCalledWith(newValue, 0);
                expect(output2.update).toHaveBeenCalledTimes(1);
                expect(output2.update).toHaveBeenCalledWith(newValue, 0);
            });
        });
        describe('update()', () => {
            const value = LogicValue_1.default.TRUE;
            const index = 0;
            beforeEach(() => {
                node.inputValues = [LogicValue_1.default.UNKNOWN];
                node.newValue = LogicValue_1.default.UNKNOWN;
                node.value = LogicValue_1.default.UNKNOWN;
            });
            it('should set the new value of the input index to TRUE', () => {
                node.update(value, index);
                expect(node.inputValues[index]).toEqual(value);
            });
            it('should set the new value to the evaluated one', () => {
                node.eval = jest.fn(() => LogicValue_1.default.FALSE);
                node.update(value, index);
                expect(node.newValue).toEqual(LogicValue_1.default.FALSE);
            });
        });
        describe('propagate()', () => {
            beforeEach(() => {
                jest
                    .spyOn(node, 'invokeEvent')
                    .mockImplementation(jest.fn());
                jest
                    .spyOn(node, 'updateOutputs')
                    .mockImplementation(jest.fn());
            });
            describe('when the value has changed', () => {
                const newValue = LogicValue_1.default.TRUE;
                const value = LogicValue_1.default.FALSE;
                const output1 = new CircuitNode_1.default('test1');
                const output2 = new CircuitNode_1.default('test2');
                const outputs = [
                    new Connection_1.default(output1, 0),
                    new Connection_1.default(output2, 0)
                ];
                beforeEach(() => {
                    node.value = value;
                    node.newValue = newValue;
                    node.outputs = outputs;
                });
                it('should set `isValueChanged` to `true`', () => {
                    expect(node.isValueChanged).toEqual(false);
                    node.propagate();
                    expect(node.isValueChanged).toEqual(true);
                });
                it('should set the `value` to `newValue`', () => {
                    expect(node.value).toEqual(value);
                    node.propagate();
                    expect(node.value).toEqual(newValue);
                });
                it('should update its outputs with the new value', () => {
                    node.propagate();
                    expect(node.updateOutputs).toHaveBeenCalledTimes(1);
                    expect(node.updateOutputs).toHaveBeenCalledWith(newValue);
                });
                it('should invoke the `change` event listener with the new value as the arg', () => {
                    node.propagate();
                    expect(node.invokeEvent).toHaveBeenCalledTimes(1);
                    expect(node.invokeEvent).toHaveBeenCalledWith('change', newValue);
                });
                it('should return an array containing all of the output nodes', () => {
                    const result = node.propagate();
                    expect(Array.isArray(result)).toBe(true);
                    expect(result).toHaveLength(outputs.length);
                    expect(result).toContain(output1);
                    expect(result).toContain(output2);
                });
            });
            describe('when the value has not changed', () => {
                it('should return an empty array', () => {
                    node.value = LogicValue_1.default.TRUE;
                    node.newValue = LogicValue_1.default.TRUE;
                    const result = node.propagate();
                    expect(Array.isArray(result)).toBe(true);
                    expect(result).toHaveLength(0);
                });
            });
        });
        describe('reset()', () => {
            beforeEach(() => {
                jest
                    .spyOn(node, 'invokeEvent')
                    .mockImplementation(jest.fn());
                node.value = LogicValue_1.default.TRUE;
                node.newValue = LogicValue_1.default.TRUE;
                node.reset();
            });
            it('should set the value to be Hi-Z', () => {
                expect(node.value).toEqual(LogicValue_1.default.UNKNOWN);
            });
            it('should set the new value to be Hi-Z', () => {
                expect(node.newValue).toEqual(LogicValue_1.default.UNKNOWN);
            });
            it('should call the `change` event listener', () => {
                expect(node.invokeEvent).toHaveBeenCalledTimes(1);
                expect(node.invokeEvent).toHaveBeenCalledWith('change', LogicValue_1.default.UNKNOWN);
            });
        });
        describe('on()', () => {
            it('should register the given event listener', () => {
                const eventType = 'change';
                const callback = jest.fn();
                node.on(eventType, callback);
                expect(node.events).toContainEqual({ eventType, callback });
            });
        });
    });
});
