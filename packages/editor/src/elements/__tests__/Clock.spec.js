import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import Clock from '../Clock'
import WaveService from '../../services/WaveService'
import { TemplateSVG } from '../../svg'

describe('Clock Element', () => {
  let clock

  beforeEach(() => {
    clock = new Clock('testClock')
  })

  it('should have an instance of the SVG renderer assigned', () => {
    expect(clock).toHaveProperty('svgRenderer')
    expect(clock.svgRenderer).toBeInstanceOf(TemplateSVG)
  })

  it('should update the interval of the clock instance when the `interval` prop is changed', () => {
    jest
      .spyOn(clock, 'resetInterval')
      .mockImplementation(jest.fn())

    clock.settings.interval.onUpdate()

    expect(clock.resetInterval).toHaveBeenCalledTimes(1)
  })

  describe('registerCircuitNode()', () => {
    it('should have an instance of `InputNode` assigned', () => {
      expect(clock).toHaveProperty('node')
      expect(clock.node).toBeInstanceOf(InputNode)
    })

    xit('should set the node\'s value to the initial value in settings', () => {
      jest.spyOn(InputNode.prototype, 'setValue')

      const value = LogicValue.TRUE

      clock.settings.startValue.value = value
      clock.registerCircuitNode()

      expect(InputNode.prototype.setValue).toHaveBeenCalledTimes(1)
      expect(InputNode.prototype.setValue).toHaveBeenCalledWith(value)
    })
  })

  describe('registerClock()', () => {
    it('should assign a new instance of the clock service', () => {
      clock.canvas = null
      clock.registerClock()

      // expect(clock).toHaveProperty('clock')
      expect(clock.clock).toBeInstanceOf(WaveService)
    })

    it('should add the clock instance to the editor\'s oscillation manager if the editor is available', () => {
      clock.canvas = {
        oscillation: {
          add: jest.fn()
        }
      }

      jest.spyOn(clock.canvas.oscillation, 'add')
      clock.registerClock()

      expect(clock.canvas.oscillation.add).toHaveBeenCalledTimes(1)
      expect(clock.canvas.oscillation.add).toHaveBeenCalledWith(clock.clock)
    })
  })

  describe('resetInterval()', () => {
    it('should call `setInterval` on the clock instance', () => {
      clock.clock = {
        setInterval: jest.fn()
      }
      jest.spyOn(clock.clock, 'setInterval')

      clock.resetInterval()

      expect(clock.clock.setInterval).toHaveBeenCalledTimes(1)
      expect(clock.clock.setInterval).toHaveBeenCalledWith(clock.settings.interval.value)
    })
  })

  describe('getSvg()', () => {
    it('should return the SVG data from the renderer with the proper wire color applied', () => {
      const valueColor = clock.getWireColor(clock.node.getProjectedValue())
      const expectedData = clock
        .svgRenderer
        .setTemplateVariables({ valueColor })
        .getSvgData()

      expect(clock.getSvg()).toEqual(expectedData)
    })
  })
})