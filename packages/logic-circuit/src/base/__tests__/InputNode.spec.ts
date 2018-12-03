import InputNode from '../InputNode'
import LogicValue from '../../types/LogicValue'
import CircuitNode from '../CircuitNode'

describe('Input Node', () => {
  let node

  beforeEach(() => {
    node = new InputNode('testNode')
  })

  it('should extend CircuitNode', () => {
    expect(node).toBeInstanceOf(CircuitNode)
  })

  describe('setValue()', () => {
    it('should set the new value to the given one', () => {
      const value = LogicValue.FALSE

      node.newValue = LogicValue.UNKNOWN
      node.setValue(value)

      expect(node.newValue).toEqual(value)
    })

    it('should set `eval()` to return the given value', () => {
      const value = LogicValue.FALSE

      node.value = value
      node.setValue(value)
      
      expect(node.eval()).toEqual(value)
    })
  })
})