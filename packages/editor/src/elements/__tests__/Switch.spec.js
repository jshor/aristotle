import draw2d from 'draw2d'
import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import ToggleService from '../../services/ToggleService'
import Switch from '../Switch'
import { TemplateSVG } from '../../svg'

describe('Switch element', () => {
  let element

  beforeEach(() => {
    element = new Switch('testSwitch')
  })

  afterEach(() => jest.resetAllMocks())

  it('should have an instance of the SVG renderer assigned', () => {
    expect(element).toHaveProperty('svgRenderer')
    expect(element.svgRenderer).toBeInstanceOf(TemplateSVG)
  })

  describe('registerCircuitNode()', () => {
    it('should have an instance of `InputNode` assigned', () => {
      expect(element).toHaveProperty('node')
      expect(element.node).toBeInstanceOf(InputNode)
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

  describe('attachClickableArea()', () => {
    beforeEach(() => {
      jest
        .spyOn(element, 'add')
        .mockImplementation(jest.fn())
      
      element.invertValue = jest.fn()
    })

    it('should add a clickable area to the element', () => {
      element.attachClickableArea()

      expect(element).toHaveProperty('clickableArea')
      expect(element.clickableArea).toBeInstanceOf(draw2d.shape.basic.Rectangle)
      expect(element.add).toHaveBeenCalledTimes(1)
      expect(element.add).toHaveBeenCalledWith(
        element.clickableArea,
        expect.any(draw2d.layout.locator.XYAbsPortLocator)
      )
    })

    it('should set the `click` event handler to invert the element\'s value', () => {
      const spy = jest.spyOn(draw2d.shape.basic.Rectangle.prototype, 'on')

      element.attachClickableArea()

      expect(spy).toHaveBeenCalledWith('click', element.invertValue)
    })
  })

  describe('getSvg()', () => {
    it('should return the SVG data from the renderer with the active wire color and on position', () => {
      element.node = {
        getProjectedValue: jest.fn(() => LogicValue.TRUE)
      }

      const valueColor = element.getWireColor(element.node.getProjectedValue())
      const y = 15
      const expectedData = element
        .svgRenderer
        .setTemplateVariables({ valueColor, y })
        .getSvgData()

      expect(element.getSvg()).toEqual(expectedData)
    })

      it('should return the SVG data from the renderer with the inactive wire color and off position', () => {
      element.node = {
        getProjectedValue: jest.fn(() => LogicValue.FALSE)
      }

      const valueColor = element.getWireColor(element.node.getProjectedValue())
      const y = 48
      const expectedData = element
        .svgRenderer
        .setTemplateVariables({ valueColor, y })
        .getSvgData()

      expect(element.getSvg()).toEqual(expectedData)
    })
  })
})