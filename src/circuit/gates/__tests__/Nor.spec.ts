import Nor from '../Nor'
import LogicValue from '../../types/LogicValue'

describe('Nor Gate', () => {
  let node

  beforeEach(() => {
    node = new Nor('testNor')
  })

  describe('eval()', () => {

    describe('when at least one Hi-Z value is present', () => {
      it('should return FALSE when one of the input values is TRUE', () => {
        node.inputValues = [LogicValue.TRUE, LogicValue.UNKNOWN]
  
        expect(node.eval()).toEqual(LogicValue.FALSE)
      })
      
      it('should return FALSE when multiple input values are TRUE', () => {
        node.inputValues = [LogicValue.TRUE, LogicValue.TRUE, LogicValue.UNKNOWN]
  
        expect(node.eval()).toEqual(LogicValue.FALSE)
      })

      it('should return Hi-Z when all input values are either FALSE or Hi-Z', () => {
        node.inputValues = [LogicValue.FALSE, LogicValue.FALSE, LogicValue.UNKNOWN]
  
        expect(node.eval()).toEqual(LogicValue.UNKNOWN)
      })

      it('should return Hi-Z when all input values are Hi-Z', () => {
        node.inputValues = [LogicValue.UNKNOWN]
  
        expect(node.eval()).toEqual(LogicValue.UNKNOWN)
      })
    })

    describe('when all values are binary', () => {
      it('should return FALSE when one of the input values is TRUE', () => {
        node.inputValues = [LogicValue.TRUE, LogicValue.FALSE]
  
        expect(node.eval()).toEqual(LogicValue.FALSE)
      })

      it('should return FALSE when multiple input values are TRUE', () => {
        node.inputValues = [LogicValue.TRUE, LogicValue.TRUE, LogicValue.FALSE]
  
        expect(node.eval()).toEqual(LogicValue.FALSE)
      })

      it('should return TRUE when all input values are FALSE', () => {
        node.inputValues = [LogicValue.FALSE, LogicValue.FALSE]
  
        expect(node.eval()).toEqual(LogicValue.TRUE)
      })
    })
  })
})