import Digit from '../Digit'
import { OutputNode, LogicValue } from '@aristotle/logic-circuit'
import Connection from '../../Connection'
import { DigitSVG } from '../../svg'
import Switch from '../Switch'

describe('Digit Element', () => {
  let digit

  beforeEach(() => {
    digit = new Digit('foo')
  })

  it('should have an instance of the SVG renderer assigned', () => {
    expect(digit).toHaveProperty('svgRenderer')
    expect(digit.svgRenderer).toBeInstanceOf(DigitSVG)
  })

  describe('createInput()', () => {
    it('should return a new OutputNode', () => {
      expect(digit.createInput()).toBeInstanceOf(OutputNode)
    })
  })

  describe('getBinaryValue()', () => {
    const setNodeValues = (...values) => {
      digit.nodes = values.map((value) => ({ value }))
    }
    const { TRUE, FALSE } = LogicValue

    it('should return `0100` when the node values are `FALSE`, `FALSE`, `TRUE`, `FALSE`', () => {
      setNodeValues(FALSE, FALSE, TRUE, FALSE)
      expect(digit.getBinaryValue()).toEqual('0100')
    })

    it('should return `0110` when the node values are `FALSE`, `TRUE`, `TRUE`, `FALSE`', () => {
      setNodeValues(FALSE, TRUE, TRUE, FALSE)
      expect(digit.getBinaryValue()).toEqual('0110')
    })

    it('should return `0101` when the node values are `TRUE`, `FALSE`, `FALSE`, `FALSE`', () => {
      setNodeValues(TRUE, FALSE, TRUE, FALSE)
      expect(digit.getBinaryValue()).toEqual('0101')
    })
  })

  describe('getHexadecimalValue()', () => {
    it('should return \'b\' for 1011', () => {
      jest.spyOn(digit, 'getBinaryValue').mockReturnValue('1011')
      expect(digit.getHexadecimalValue()).toEqual('b')
    })

    it('should return \'c\' for 1100', () => {
      jest.spyOn(digit, 'getBinaryValue').mockReturnValue('1100')
      expect(digit.getHexadecimalValue()).toEqual('c')
    })
  })

  describe('change()', () => {
    it('should update the svg', () => {
      jest.spyOn(digit, 'setPath')
      digit.change()

      expect(digit.setPath).toHaveBeenCalledTimes(1)
      expect(digit.setPath).toHaveBeenCalledWith(digit.getSvg().path)
    })
  })

  describe('getCircuitNode()', () => {
    const attachToNthPort = (n) => {
      const target = new Switch()
      const connection = new Connection()
      const targetPort = digit.getInputPort(n)
      const sourcePort = target.getOutputPort(0)

      connection.setTarget(targetPort)
      connection.setSource(sourcePort)

      return digit.getCircuitNode(connection)
    }

    it('should return the CircuitNode instance belonging to the 0th port', () => {
      expect(attachToNthPort(0)).toEqual(digit.nodes[0])
    })

    it('should return the CircuitNode instance belonging to the 1st port', () => {
      expect(attachToNthPort(1)).toEqual(digit.nodes[1])
    })

    it('should return the CircuitNode instance belonging to the 2nd port', () => {
      expect(attachToNthPort(2)).toEqual(digit.nodes[2])
    })

    it('should return the CircuitNode instance belonging to the 3rd port', () => {
      expect(attachToNthPort(3)).toEqual(digit.nodes[3])
    })
  })
})
