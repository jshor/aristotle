import { Figure } from 'draw2d'
import ToolboxButton from '../ToolboxButton'
import LogicGate from '../../elements/LogicGate'

describe('Toolbox Button', () => {
  let element, toolboxButton

  beforeEach(() => {
    element = new LogicGate('testGate', {})
    element.parent = new LogicGate('testParent', {})
    element.canvas = {
      on: jest.fn()
    }

    toolboxButton = new ToolboxButton(element, 16, 16)
  })

  describe('addEventListeners()', () => {
    it('should toggle the toolbox visibility when the element is added', () => {
      const spy = jest.spyOn(toolboxButton.element, 'on')

      toolboxButton.addEventListeners()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith('added', toolboxButton.toggleVisibility)
    })

    xit('should toggle the toolbox visibility when the element\'s selection state is changed', () => {
      const spy = jest.spyOn(toolboxButton.figure.canvas, 'on')

      toolboxButton.addEventListeners()

      expect(spy).toHaveBeenCalledWith('unselect', toolboxButton.toggleVisibility)
      expect(spy).toHaveBeenCalledWith('select', toolboxButton.toggleVisibility)
    })

    xit('should scale the size of the icon when the canvas is zoomed', () => {
      const spy = jest.spyOn(toolboxButton.figure.canvas, 'on')

      toolboxButton.addEventListeners()

      expect(spy).toHaveBeenCalledWith('zoomed', toolboxButton.scaleToZoomFactor)
    })
  })

  describe('toggleVisibility()', () => {
    beforeEach(() => {
      jest
        .spyOn(Figure.prototype, 'setVisible')
        .mockImplementation(jest.fn())
    })

    it('should set the visibility to true if the element is selected', () => {
      jest
        .spyOn(Figure.prototype, 'isSelected')
        .mockReturnValue(true)

      toolboxButton.toggleVisibility()

      expect(Figure.prototype.setVisible).toHaveBeenCalledWith(true, undefined)
    })

    it('should set the visibility to false if the element is not selected', () => {
      jest
        .spyOn(Figure.prototype, 'isSelected')
        .mockReturnValue(false)

      toolboxButton.toggleVisibility()

      expect(Figure.prototype.setVisible).toHaveBeenCalledWith(false, undefined)
    })
  })

  describe('scaleToZoomFactor()', () => {
    beforeEach(() => {
      jest
        .spyOn(Figure.prototype, 'setWidth')
        .mockImplementation(jest.fn())
      jest
        .spyOn(Figure.prototype, 'setHeight')
        .mockImplementation(jest.fn())
    })

    it('should update the visibility of the container figure if the element is selected', () => {
      element.canvas.zoomFactor = 0.4
      toolboxButton.scaleToZoomFactor()

      const relativeSize = 16 / (1 / element.canvas.zoomFactor)

      expect(Figure.prototype.setWidth).toHaveBeenCalledWith(relativeSize)
      expect(Figure.prototype.setHeight).toHaveBeenCalledWith(relativeSize)
    })
  })

  describe('fireToolboxEvent()', () => {
    it('should fire `toolbox.open` with the element ID, settings map, and location', () => {
      const position = {
        x: 10,
        y: 14
      }

      toolboxButton.container.canvas = {
        fireEvent: jest.fn(),
        fromCanvasToDocumentCoordinate: jest.fn(() => position)
      }

      const spy = jest
        .spyOn(toolboxButton.container.canvas, 'fireEvent')
        .mockImplementation(jest.fn())

      toolboxButton.fireToolboxEvent()

      expect(spy).toHaveBeenCalledWith('properties:open', {
        elementId: toolboxButton.element.id,
        properties: toolboxButton.element.properties,
        position
      })
    })
  })
})
