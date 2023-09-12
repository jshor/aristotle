import CircuitNode from '../CircuitNode'
import Connection from '../Connection'
import LogicValue from '@/types/enums/LogicValue'

describe('Circuit Node', () => {
  const name = 'testCircuitNode'
  let node: CircuitNode

  beforeEach(() => {
    node = new CircuitNode(name)
  })

  afterEach(() => jest.resetAllMocks())

  it('should set the name to the one passed into the constructor', () => {
    expect(node.name).toEqual(name)
  })

  describe('protected members', () => {
    class CircuitNodeTest extends CircuitNode {}

    beforeEach(() => {
      node = new CircuitNodeTest(name)
    })

    describe('eval()', () => {
      it('should, by default, only return the node\'s value', () => {
        expect(node.eval()).toEqual(node.value)
      })
    })

    describe('invokeEvent()', () => {
      const eventFn1 = jest.fn()
      const eventFn2 = jest.fn()
      const eventFn3 = jest.fn()
      const newValue = LogicValue.TRUE

      beforeEach(() => {
        node.events = [
          { eventType: 'change', callback: eventFn1 },
          { eventType: 'reset', callback: eventFn2 },
          { eventType: 'change', callback: eventFn3 }
        ]
      })

      it('should call only the \'change\' eventType callbacks', () => {
        node.invokeEvent('change', newValue, [])

        expect(eventFn2).not.toHaveBeenCalled()
        expect(eventFn1).toHaveBeenCalledTimes(1)
        expect(eventFn1).toHaveBeenCalledWith(newValue, [])
        expect(eventFn3).toHaveBeenCalledTimes(1)
        expect(eventFn3).toHaveBeenCalledWith(newValue, [])
      })

      it('should call only the \'reset\' eventType callbacks', () => {
        node.invokeEvent('reset', newValue, [])

        expect(eventFn1).not.toHaveBeenCalled()
        expect(eventFn3).not.toHaveBeenCalled()
        expect(eventFn2).toHaveBeenCalledTimes(1)
        expect(eventFn2).toHaveBeenCalledWith(newValue, [])
      })
    })

    describe('valueCount()', () => {
      it('should return 2 for two present TRUE logic values', () => {
        node.inputValues = {
          input1: LogicValue.FALSE,
          input2: LogicValue.TRUE,
          input3: LogicValue.TRUE
        }

        expect(node.valueCount(LogicValue.TRUE)).toEqual(2)
      })

      it('should return 0 for no present FALSE logic values', () => {
        node.inputValues = {
          input1: LogicValue.UNKNOWN,
          input2: LogicValue.TRUE,
          input3: LogicValue.TRUE
        }

        expect(node.valueCount(LogicValue.FALSE)).toEqual(0)
      })
    })
  })

  describe('updateOutputs()', () => {
    const output1 = new CircuitNode('test1')
    const output2 = new CircuitNode('test2')

    beforeEach(() => {
      jest
        .spyOn(output1, 'update')
        .mockImplementation(jest.fn())
      jest
        .spyOn(output2, 'update')
        .mockImplementation(jest.fn())

      node.outputs = [
        new Connection(output1, output1.name),
        new Connection(output2, output2.name)
      ]
    })

    it('should call `update()` with the given value on each output node', () => {
      const newValue = LogicValue.TRUE

      node.updateOutputs(newValue)

      expect(output1.update).toHaveBeenCalledTimes(1)
      expect(output1.update).toHaveBeenCalledWith(newValue, output1.name)
      expect(output2.update).toHaveBeenCalledTimes(1)
      expect(output2.update).toHaveBeenCalledWith(newValue, output2.name)
    })
  })

  describe('update()', () => {
    const value = LogicValue.TRUE
    const id = 'input1'

    beforeEach(() => {
      node.inputValues = {
        [id]: LogicValue.UNKNOWN
      }
      node.newValue = LogicValue.UNKNOWN
      node.value = LogicValue.UNKNOWN
    })

    it('should set the new value of the input index to TRUE', () => {
      node.update(value, id)

      expect(node.inputValues[id]).toEqual(value)
    })

    it('should set the new value to the evaluated one', () => {
      node.eval = jest.fn(() => LogicValue.FALSE)
      node.update(value, id)

      expect(node.newValue).toEqual(LogicValue.FALSE)
    })
  })

  describe('propagate()', () => {
    beforeEach(() => {
      jest
        .spyOn(node, 'invokeEvent')
        .mockImplementation(jest.fn())
      jest
        .spyOn(node, 'updateOutputs')
        .mockImplementation(jest.fn())
    })

    describe('when the value has changed', () => {
      const newValue = LogicValue.TRUE
      const value = LogicValue.FALSE
      const output1 = new CircuitNode('test1')
      const output2 = new CircuitNode('test2')
      const outputs = [
        new Connection(output1, output1.name),
        new Connection(output2, output2.name)
      ]

      beforeEach(() => {
        node.value = value
        node.newValue = newValue
        node.outputs = outputs
      })

      xit('should set `isValueChanged` to `true`', () => {
        expect(node.isValueChanged).toEqual(false)

        node.propagate()

        expect(node.isValueChanged).toEqual(true)
      })

      it('should set the `value` to `newValue`', () => {
        expect(node.value).toEqual(value)

        node.propagate()

        expect(node.value).toEqual(newValue)
      })

      it('should update its outputs with the new value', () => {
        node.propagate()

        expect(node.updateOutputs).toHaveBeenCalledTimes(1)
        expect(node.updateOutputs).toHaveBeenCalledWith(newValue)
      })

      it('should return an array containing all of the output nodes', () => {
        const result = node.propagate()

        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(outputs.length)
        expect(result).toContain(output1)
        expect(result).toContain(output2)
      })
    })

    describe('when the value has not changed', () => {
      it('should return an empty array', () => {
        node.value = LogicValue.TRUE
        node.newValue = LogicValue.TRUE

        const result = node.propagate()

        expect(Array.isArray(result)).toBe(true)
        expect(result).toHaveLength(0)
      })
    })
  })

  describe('reset()', () => {
    beforeEach(() => {
      jest
        .spyOn(node, 'invokeEvent')
        .mockImplementation(jest.fn())

      node.value = LogicValue.TRUE
      node.newValue = LogicValue.TRUE
      node.reset()
    })

    it('should set the value to be Hi-Z', () => {
      expect(node.value).toEqual(LogicValue.UNKNOWN)
    })

    it('should set the new value to be Hi-Z', () => {
      expect(node.newValue).toEqual(LogicValue.UNKNOWN)
    })

    it('should call the `change` event listener', () => {
      expect(node.invokeEvent).toHaveBeenCalledTimes(1)
      expect(node.invokeEvent).toHaveBeenCalledWith('change', LogicValue.UNKNOWN, [])
    })
  })

  describe('on()', () => {
    it('should register the given event listener', () => {
      const eventType = 'change'
      const callback = jest.fn()

      node.on(eventType, callback)

      expect(node.events).toContainEqual({ eventType, callback })
    })
  })
})
