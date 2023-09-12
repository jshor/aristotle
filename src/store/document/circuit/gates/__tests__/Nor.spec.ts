import Nor from '../Nor'
import LogicValue from '@/types/enums/LogicValue'

describe('Nor Gate', () => {
  let node: Nor

  beforeEach(() => {
    node = new Nor('testNor')
  })

  describe.skip('eval()', () => {
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

      it('should return true when all input values are either FALSE or Hi-Z', () => {
        node.inputValues = {
          input1: LogicValue.FALSE,
          input2: LogicValue.FALSE,
          input3: LogicValue.UNKNOWN
        }

        expect(node.eval()).toEqual(LogicValue.TRUE)
      })

      it('should return true when no inputs are true', () => {
        node.inputValues = {
          input1: LogicValue.UNKNOWN
        }

        expect(node.eval()).toEqual(LogicValue.TRUE)
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
