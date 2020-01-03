import { Nor, Or, LogicValue } from '@aristotle/logic-circuit'
import { LogicGateSVG } from '../../svg'
import LogicGate from '../LogicGate'
import Element from '../../Element'
import CommandSetInputCount from '../../commands/CommandSetInputCount'

describe('LogicGate element', () => {
  let element

  beforeEach(() => {
    element = new LogicGate('testNor')
  })

  afterEach(() => jest.resetAllMocks())

  it('should have an instance of the SVG renderer assigned', () => {
    expect(element).toHaveProperty('svgRenderer')
    expect(element.svgRenderer).toBeInstanceOf(LogicGateSVG)
  })

  describe('registerCircuitNode()', () => {
    it('should have an instance of `InputNode` assigned', () => {
      expect(element).toHaveProperty('node')
      expect(element.node).toBeInstanceOf(Nor)
    })

    xit('should set the node\'s value to the initial value in settings', () => {
      jest.spyOn(InputNode.prototype, 'setValue')

      const value = LogicValue.TRUE

      element.settings.startValue.value = value
      element.registerCircuitNode()

      expect(InputNode.prototype.setValue).toHaveBeenCalledTimes(1)
      expect(InputNode.prototype.setValue).toHaveBeenCalledWith(value)
    })
  })

  describe('updateSettings()', () => {
    it('should execute an input count change command if `inputs` are described in the settings', () => {
      jest
        .spyOn(element, 'persistToolbox')
        .mockImplementation(jest.fn())

      element.canvas = {
        commandStack: {
          execute: jest.fn()
        }
      }
      element.updateSettings({
        inputs: 3
      })

      expect(element.canvas.commandStack.execute).toHaveBeenCalledTimes(1)
      expect(element.canvas.commandStack.execute).toHaveBeenCalledWith(expect.any(CommandSetInputCount))
    })
  })

  describe('getSvg()', () => {
    it('should return the SVG data from the renderer with the inactive wire color and off position', () => {
      expect(element.getSvg()).toEqual(element.svgRenderer.getSvgData())
    })
  })

  describe('getLogicGate()', () => {
    it('should return a Nor gate instance when the gateType setting is NOR', () => {
      element.settings.gateType.value = 'NOR'

      expect(element.getLogicGate()).toBeInstanceOf(Nor)
    })

    it('should return a Nor gate instance when the gateType setting is OR', () => {
      element.settings.gateType.value = 'OR'

      expect(element.getLogicGate()).toBeInstanceOf(Or)
    })
  })
})
