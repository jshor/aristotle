import Nor from '../Nor'
import LogicValue from '../../types/LogicValue'

describe('Nor Gate', () => {
  let node: Nor

  beforeEach(() => {
    node = new Nor('testNor')
  })

  describe('eval()', () => {
    describe('when at least one Hi-Z value is present', () => {
      it('should return FALSE when one of the input values is TRUE', () => {
        node.inputValues = {
          input1: LogicValue.TRUE,
          input2: LogicValue.UNKNOWN
        }

        expect(node.eval()).toEqual(LogicValue.FALSE)
      })

      it('should return FALSE when multiple input values are TRUE', () => {
        node.inputValues = {
          input1: LogicValue.TRUE,
          input2: LogicValue.TRUE,
          input3: LogicValue.UNKNOWN
        }

        expect(node.eval()).toEqual(LogicValue.FALSE)
      })

      it('should return Hi-Z when all input values are either FALSE or Hi-Z', () => {
        node.inputValues = {
          input1: LogicValue.FALSE,
          input2: LogicValue.FALSE,
          input3: LogicValue.UNKNOWN
        }

        expect(node.eval()).toEqual(LogicValue.UNKNOWN)
      })

      it('should return Hi-Z when all input values are Hi-Z', () => {
        node.inputValues = {
          input1: LogicValue.UNKNOWN
        }

        expect(node.eval()).toEqual(LogicValue.UNKNOWN)
      })
    })

    describe('when all values are binary', () => {
      it('should return FALSE when one of the input values is TRUE', () => {
        node.inputValues = {
          input1: LogicValue.TRUE,
          input2: LogicValue.FALSE
        }

        expect(node.eval()).toEqual(LogicValue.FALSE)
      })

      it('should return FALSE when multiple input values are TRUE', () => {
        node.inputValues = {
          input1: LogicValue.TRUE,
          input2: LogicValue.TRUE,
          input3: LogicValue.FALSE
        }

        expect(node.eval()).toEqual(LogicValue.FALSE)
      })

      it('should return TRUE when all input values are FALSE', () => {
        node.inputValues = {
          input1: LogicValue.FALSE,
          input2: LogicValue.FALSE
        }

        expect(node.eval()).toEqual(LogicValue.TRUE)
      })
    })
  })
})
