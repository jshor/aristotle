import { shape, layout } from 'draw2d'
import { LogicValue, Nor } from '@aristotle/logic-circuit'
import Element from '../Element'

const { Image } = shape.basic

describe('Element base class', () => {
  const id = 'abc78bd8c7a7d9ae'
  let element

  beforeEach(() => {
    element = new Element(id)
    element.getSvg = () => jest.fn()
    element.node = new Nor(id)
  })

  afterEach(() => jest.resetAllMocks())

  describe('getSetting()', () => {
    it('should return the value given setting', () => {
      element.settings = {
        foo: {
          value: 'bar'
        },
        baz: {
          value: '1'
        }
      }

      expect(element.getSetting('foo')).toEqual('bar')
      expect(element.getSetting('baz')).toEqual('1')
    })
  })

  describe('setValue()', () => {
    xit('should set the circuit value of the current node', () => {
      const value = LogicValue.TRUE

      jest.spyOn(element.node, 'setValue')

      element.setValue(value)

      expect(element.node).toHaveBeenCalledTimes(1)
      expect(element.node).toHaveBeenCalledWith(value)
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
    const color = '#e98c8e'

    it('should update the outgoing wire colors of each of the outgoing wires', () => {
      const conn = mockConnection(element)
      jest.spyOn(conn, 'setColor')
      jest
        .spyOn(element, 'getConnections')
        .mockReturnValue({ data: [conn] })

        element.setOutputConnectionColor(color)
      
      expect(conn.setColor).toHaveBeenCalledTimes(1)
      expect(conn.setColor).toHaveBeenCalledWith(color)
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

  describe('isSelected()', () => {
    it('should return true if the element is in the available selection set', () => {
      element.canvas = {
        selection: {
          all: {
            data: [element]
          }
        }
      }

      expect(element.isSelected()).toEqual(true)
    })

    it('should return false if the element is not in the available selection set', () => {
      element.canvas = {
        selection: {
          all: {
            data: []
          }
        }
      }

      expect(element.isSelected()).toEqual(false)
    })

    it('should return false if the selection data is not available', () => {
      element.canvas = { selection: null }

      expect(element.isSelected()).toEqual(false)
    })

    it('should return false if the canvas is not available', () => {
      element.canvas = null

      expect(element.isSelected()).toEqual(false)
    })
  })

  describe('updateSelectionColor()', () => {
    const path = '<svg />'

    beforeEach(() => {
      element.canvas = {}

      jest
        .spyOn(element, 'getSvg')
        .mockReturnValue({ path })
      jest
        .spyOn(element, 'setPath')
        .mockImplementation(jest.fn())
    })

    it('should should call setPath() with the path value returned from getSvg()', () => {
      element.updateSelectionColor()

      expect(element.setPath).toHaveBeenCalledTimes(1)
      expect(element.setPath).toHaveBeenCalledWith(path)
    })

    it('should render with an SVG with the selection color, if selected', () => {
      element.isSelected = () => true
      element.updateSelectionColor()
      
      expect(element.getSvg).toHaveBeenCalledWith('#ff0000')
    })

    it('should render with an SVG with the default color, if not selected', () => {
      element.isSelected = () => false
      element.updateSelectionColor()
      
      expect(element.getSvg).toHaveBeenCalledWith('#000')
    })

    it('should not update the selection color if the canvas is unavailable', () => {
      element.canvas = null
      element.updateSelectionColor()

      expect(element.setPath).not.toHaveBeenCalled()
    })
  })

  describe('setPorts()', () => {
    beforeEach(() => {
      jest
        .spyOn(element, 'createPort')
        .mockReturnValue({ setId: jest.fn() })
    })

    it('should call the factory port creation method for each port', () => {
      const port1 = { x: 1, y: 2, type: 'input', id: '123' }
      const port2 = { x: 3, y: 4, type: 'output', id: '321' }
      
      element.setPorts([port1, port2])

      expect(element.createPort).toHaveBeenCalledTimes(2)
      expect(element.createPort).toHaveBeenCalledWith(port1.type, expect.any(layout.locator.XYAbsPortLocator))
      expect(element.createPort).toHaveBeenCalledWith(port2.type, expect.any(layout.locator.XYAbsPortLocator))
    })

    it('should not render any ports if the given list is empty', () => {
      element.setPorts([])

      expect(element.createPort).not.toHaveBeenCalled()
    })
  })

  describe('hasSettings()', () => {
    it('should be truthy if settings are defined', () => {
      element.settings = {
        foo: {
          value: 'bar'
        }
      }

      expect(element.hasSettings()).toBeTruthy()
    })
    
    it('should be falsy if settings are not defined', () => {
      element.settings = {}

      expect(element.hasSettings()).toBeFalsy()
    })
  })

  describe('toggleToolboxVisibility()', () => {
    let toolboxButton

    beforeEach(() => {
      toolboxButton = { setVisible: jest.fn() }
      jest.spyOn(toolboxButton, 'setVisible')
    })

    it('should set the visibility if the toolbox element is present', () => {
      const isSelected = true

      element.toolboxButton = toolboxButton
      element.isSelected = jest.fn(() => isSelected)
      element.toggleToolboxVisibility()

      expect(toolboxButton.setVisible).toHaveBeenCalledTimes(1)
      expect(toolboxButton.setVisible).toHaveBeenCalledWith(isSelected)
    })

    it('should set the visibility if the toolbox element is present', () => {
      element.toolboxButton = null
      element.toggleToolboxVisibility()

      expect(toolboxButton.setVisible).not.toHaveBeenCalled()
    })
  })

  describe('fireToolboxEvent()', () => {
    const button = { x: 13, y: 99 }

    beforeEach(() => {
      element.canvas = {
        fireEvent: jest.fn(),
        fromCanvasToDocumentCoordinate (x, y) {
          return { x, y }
        }
      }
      element.settings = {
        foo: {
          value: 'bar'
        }
      }
      element.x = 42
      element.y = 69
    })

    it('should retrieve the canvas coordinates based on the given button ones', () => {
      const x = button.x + element.x
      const y = button.y + element.y

      jest.spyOn(element.canvas, 'fromCanvasToDocumentCoordinate')
      element.fireToolboxEvent(button)

      expect(element.canvas.fromCanvasToDocumentCoordinate).toHaveBeenCalledWith(x, y)
    })

    it('should fire the `toolbox` event with the toolbox position and element settings', () => {
      const x = button.x + element.x
      const y = button.y + element.y

      jest.spyOn(element.canvas, 'fromCanvasToDocumentCoordinate')
      element.fireToolboxEvent(button)

      expect(element.canvas.fireEvent).toHaveBeenCalledTimes(1)
      expect(element.canvas.fireEvent).toHaveBeenCalledWith('toolbox', {
        settings: element.settings,
        position: { x, y }
      })
    })
  })

  describe('createToolboxButton()', () => {
    beforeEach(() => {
      jest
        .spyOn(element, 'add')
        .mockImplementation(jest.fn())
    })

    describe('when settings are defined and no toolbox button exists on the element', () => {
      beforeEach(() => {
        element.toolboxButton = null
        element.hasSettings = jest.fn(() => true)

        jest
          .spyOn(shape.icon.Wrench.prototype, 'on')
          .mockImplementation(jest.fn())
        
        element.createToolboxButton()
      })

      it('should define the toolbox button', () => {
        expect(element).toHaveProperty('toolboxButton')
        expect(element.toolboxButton).toBeDefined()
        expect(element.toolboxButton).toEqual(expect.any(shape.icon.Wrench))
      })
      
      it('should attach a new wrench icon to the element', () => {
        const { Wrench } = shape.icon
        const { XYAbsPortLocator } = layout.locator

        expect(element.add).toHaveBeenCalledTimes(1)
        expect(element.add).toHaveBeenCalledWith(expect.any(Wrench), expect.any(XYAbsPortLocator))
      })

      it('should set a click event on the toolbox button', () => {
        expect(shape.icon.Wrench.prototype.on).toHaveBeenCalledWith('click', element.fireToolboxEvent)
      })
    })

    it('should not add the toolbox button if one already exists', () => {
      element.toolboxButton = new shape.icon.Wrench()
      element.createToolboxButton()

      expect(element.add).not.toHaveBeenCalled()
    })

    it('should not add the toolbox button if no settings are defined on the element', () => {
      element.hasSettings = jest.fn(() => false)
      element.createToolboxButton()

      expect(element.add).not.toHaveBeenCalled()
    })
  })
})