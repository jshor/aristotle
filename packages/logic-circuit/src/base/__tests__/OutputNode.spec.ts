import OutputNode from '../OutputNode'
import LogicValue from '../../types/LogicValue'
import CircuitNode from '../CircuitNode'

describe('Output Node', () => {
  let node

  beforeEach(() => {
    node = new OutputNode('testNode')
  })

  it('should extend CircuitNode', () => {
    expect(node).toBeInstanceOf(CircuitNode)
  })

  describe('update()', () => {
    it('should set the new value to the given one', () => {
      const value = LogicValue.FALSE

      node.newValue = LogicValue.UNKNOWN
      node.update(value)

      expect(node.newValue).toEqual(value)
    })
  })
})