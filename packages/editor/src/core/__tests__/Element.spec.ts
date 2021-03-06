import { shape, layout } from 'draw2d'
import { LogicValue, Nor } from '@aristotle/logic-circuit'
import Element from '../Element'
import CommandSetProperty from '../../commands/CommandSetProperty'
import draw2d from 'draw2d'
import { ElementPropertyValues } from '../../types'

jest.mock('../../interactivity/ToolboxButton')

const { Image } = shape.basic

describe('Element base class', () => {
  const id = 'abc78bd8c7a7d9ae'
  let element

  beforeEach(() => {
    element = new Element(id, {})
    element.getSvg = () => jest.fn()
    element.node = new Nor(id)
  })

  afterEach(() => jest.resetAllMocks())

  describe('onContextMenu()', () => {
    beforeEach(() => {
      element.canvas = {
        getSelection: () => ({
          getSize: jest.fn()
        }),
        setCurrentSelection: jest.fn()
      }
    })

    describe('when nothing is selected in the canvas', () => {
      beforeEach(() => {
        jest
          .spyOn(element.canvas, 'getSelection')
          .mockReturnValue({
            getSize: jest.fn(() => 0)
          })
      })

      it('should select only the element when invoked, if not already selected', () => {
        jest
          .spyOn(element, 'isSelected')
          .mockReturnValue(false)

        element.onContextMenu()

        expect(element.canvas.setCurrentSelection).toHaveBeenCalledTimes(2)
        expect(element.canvas.setCurrentSelection).toHaveBeenCalledWith(null)
        expect(element.canvas.setCurrentSelection).toHaveBeenLastCalledWith(element)
      })

      it('should select the element when invoked, even if it is already selected', () => {
        jest
          .spyOn(element, 'isSelected')
          .mockReturnValue(true)

        element.onContextMenu()

        expect(element.canvas.setCurrentSelection).toHaveBeenCalledTimes(2)
        expect(element.canvas.setCurrentSelection).toHaveBeenCalledWith(null)
        expect(element.canvas.setCurrentSelection).toHaveBeenLastCalledWith(element)
      })
    })

    describe('when one or more items are selected in the canvas', () => {
      beforeEach(() => {
        jest
          .spyOn(element.canvas, 'getSelection')
          .mockReturnValue({
            getSize: jest.fn(() => 1)
          })
      })

      it('should select only the element when invoked, if not already selected', () => {
        jest
          .spyOn(draw2d.Figure.prototype, 'isSelected')
          .mockReturnValue(false)

        element.onContextMenu()

        expect(element.canvas.setCurrentSelection).toHaveBeenCalledTimes(2)
        expect(element.canvas.setCurrentSelection).toHaveBeenCalledWith(null)
        expect(element.canvas.setCurrentSelection).toHaveBeenLastCalledWith(element)
      })

      it('should not select the element when invoked if it is already selected', () => {
        jest
          .spyOn(draw2d.Figure.prototype, 'isSelected')
          .mockReturnValue(true)

        element.onContextMenu()

        expect(element.canvas.setCurrentSelection).not.toHaveBeenCalled()
      })
    })
  })

  describe('getCircuitNode()', () => {
    it('should return the circuit node instance', () => {
      expect(element.getCircuitNode()).toEqual(element.node)
    })
  })

  describe('updateVisualValue()', () => {
    it('should re-render the element with an updated the output connection color', () => {
      const value = '#ff0000'

      jest
        .spyOn(element, 'setOutputConnectionColor')
        .mockImplementation(jest.fn())
      jest
        .spyOn(element, 'render')
        .mockImplementation(jest.fn())

      element.updateVisualValue(value)

      expect(element.setOutputConnectionColor).toHaveBeenCalledTimes(1)
      expect(element.setOutputConnectionColor).toHaveBeenCalledWith(value)
      expect(element.render).toHaveBeenCalledTimes(1)
    })
  })

  describe('applyProperties()', () => {
    it('should update the value of the given property if it exists on the element', () => {
      element.properties.foo = {
        type: 'text',
        value: 'bar'
      }
      element.applyProperties({ foo: 'baz' })

      expect(element.getPropertyValue('foo')).toEqual('baz')
    })

    it('should not set the property value of a non-existent property', () => {
      element.properties = {}
      element.applyProperties({ foo: 'baz' })

      expect(element.properties).not.toHaveProperty('foo')
    })
  })

  describe('getPropertyValue()', () => {
    it('should return the value for the given property name', () => {
      element.properties = {
        foo: {
          value: 'bar'
        },
        baz: {
          value: '1'
        }
      }

      expect(element.getPropertyValue('foo')).toEqual('bar')
      expect(element.getPropertyValue('baz')).toEqual('1')
    })

    it('should return null if the property doesn\'t exist', () => {
      element.properties = {}

      expect(element.getPropertyValue('foo')).toBeNull()
    })
  })

  describe('serializeProperties()', () => {
    it('should return a key-value pair of element property names to their respective values', () => {
      element.properties = {
        foo: {
          value: 'bar'
        },
        baz: {
          value: '1'
        }
      }

      const serializedProperties: ElementPropertyValues = element.serializeProperties()

      expect(serializedProperties).toHaveProperty('foo')
      expect(serializedProperties).toHaveProperty('baz')
      expect(serializedProperties['foo']).toEqual('bar')
      expect(serializedProperties['baz']).toEqual('1')
    })
  })

  describe('render()', () => {
    const ports = [{ x: 1, y: 0, type: 'input' }]
    const width = 20
    const height = 50
    const path = '<svg></svg>'

    beforeEach(() => {
      jest.spyOn(Image.prototype, 'setPath')
      jest.spyOn(Image.prototype, 'setWidth')
      jest.spyOn(Image.prototype, 'setHeight')
      jest.spyOn(element, 'setPorts')
      jest
        .spyOn(element, 'getSvg')
        .mockReturnValue({
          ports, width, height, path
        })
    })

    it('should set the width, height and path of the SVG', () => {
      element.render()

      expect(Image.prototype.setWidth).toHaveBeenCalledTimes(1)
      expect(Image.prototype.setWidth).toHaveBeenCalledWith(width)
      expect(Image.prototype.setHeight).toHaveBeenCalledTimes(1)
      expect(Image.prototype.setHeight).toHaveBeenCalledWith(height)
      expect(Image.prototype.setPath).toHaveBeenCalledTimes(1)
      expect(Image.prototype.setPath).toHaveBeenCalledWith(path)
    })

    it('should render the ports', () => {
      element.render()

      expect(element.setPorts).toHaveBeenCalledTimes(1)
      expect(element.setPorts).toHaveBeenCalledWith(ports)
    })
  })

  describe('getWireColor()', () => {
    it(`should return '#56AE7C' if the logic value is ${LogicValue.TRUE}`, () => {
      expect(element.getWireColor(LogicValue.TRUE)).toEqual('#56AE7C')
    })

    it(`should return '#868686' if the logic value is ${LogicValue.FALSE}`, () => {
      expect(element.getWireColor(LogicValue.FALSE)).toEqual('#868686')
    })

    it('should default to \'#8b0000\'', () => {
      expect(element.getWireColor(LogicValue.UNKNOWN)).toEqual('#8b0000')
    })
  })

  describe('setOutputConnectionColor()', () => {
    const mockConnection = (parent) => {
      return {
        getSource () {
          return { parent }
        },
        setColor: jest.fn()
      }
    }
    const color = '#8b0000'

    xit('should update the outgoing wire colors of each of the outgoing wires', () => {
      const conn = mockConnection(element)
      jest.spyOn(conn, 'setColor')
      jest
        .spyOn(element, 'getConnections')
        .mockReturnValue({ data: [conn] })

      element.setOutputConnectionColor(LogicValue.TRUE)

      expect(conn.setColor).toHaveBeenCalledTimes(1)
      expect(conn.setColor).toHaveBeenCalledWith(element.getWireColor(LogicValue.TRUE))
    })

    it('should not update the outgoing wire colors of an unattached outgoing wire', () => {
      const conn = mockConnection(null)
      jest.spyOn(conn, 'setColor')
      jest
        .spyOn(element, 'getConnections')
        .mockReturnValue({ data: [conn] })

      element.setOutputConnectionColor(color)

      expect(conn.setColor).not.toHaveBeenCalled()
    })
  })

  describe('updateProperties()', () => {
    beforeEach(() => {
      element.properties = {
        foo: {
          onUpdate: jest.fn()
        }
      }
      element.canvas = {
        commandStack: {
          execute: jest.fn()
        }
      }
    })

    it('should execute a CommandSetProperty for each setting present', () => {
      const newValue = 'baz'

      element.updateProperties({ foo: newValue })

      expect(element.canvas.commandStack.execute).toHaveBeenCalledTimes(1)
      expect(element.canvas.commandStack.execute).toHaveBeenCalledWith(expect.any(CommandSetProperty))
    })

    it('should persist the toolbox', () => {
      jest.spyOn(element, 'persistToolbox')
      element.updateProperties({ foo: 'baz' })

      expect(element.persistToolbox).toHaveBeenCalledTimes(1)
    })
  })

  describe('setPorts()', () => {
    let spy

    beforeEach(() => {
      spy = jest
        .spyOn(draw2d.shape.basic.Image.prototype, 'createPort')
        .mockReturnValue({ setId: jest.fn() })
    })

    it('should call the factory port creation method for each port', () => {
      const port1 = { x: 1, y: 2, type: 'input', id: '123' }
      const port2 = { x: 3, y: 4, type: 'output', id: '321' }

      element.setPorts([port1, port2])

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenCalledWith(port1.type, expect.any(layout.locator.XYAbsPortLocator))
      expect(spy).toHaveBeenCalledWith(port2.type, expect.any(layout.locator.XYAbsPortLocator))
    })

    it('should not render any ports if the given list is empty', () => {
      element.setPorts([])

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('createToolboxButton()', () => {
    beforeEach(() => {
      jest
        .spyOn(element, 'add')
        .mockImplementation(jest.fn())
    })

    describe('when the `properties` property is defined and no toolbox button exists on the element', () => {
      it('should define the toolbox button', () => {
        element.toolboxButton = null
        element.properties = {}

        element.createToolboxButton()

        expect(element).toHaveProperty('toolboxButton')
        expect(element.toolboxButton).toBeDefined()
      })
    })

    it('should not add the toolbox button if one already exists', () => {
      element.toolboxButton = {}
      element.createToolboxButton()

      expect(element.add).not.toHaveBeenCalled()
    })

    it('should not add the toolbox button if no properties defined on the element', () => {
      element.properties = {}
      element.createToolboxButton()

      expect(element.add).not.toHaveBeenCalled()
    })
  })

  describe('persistToolbox', () => {
    it('should notify the toolbox to keep open if the button was created', () => {
      element.toolboxButton = {
        fireToolboxEvent: jest.fn()
      }
      jest.spyOn(element.toolboxButton, 'fireToolboxEvent')

      element.persistToolbox()

      expect(element.toolboxButton.fireToolboxEvent).toHaveBeenCalledTimes(1)
    })
  })
})
