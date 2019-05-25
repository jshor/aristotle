import { shape, layout } from 'draw2d'
import { LogicValue, Nor } from '@aristotle/logic-circuit'
import Element from '../Element'

jest.mock('../ToolboxButton')

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
    const color = '#8b0000'

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

  describe('createToolboxButton()', () => {
    beforeEach(() => {
      jest
        .spyOn(element, 'add')
        .mockImplementation(jest.fn())
    })

    describe('when the `settings` property is defined and no toolbox button exists on the element', () => {
      it('should define the toolbox button', () => {
        element.toolboxButton = null
        element.settings = {}

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

    it('should not add the toolbox button if no settings defined on the element', () => {
      element.settings = null
      element.createToolboxButton()

      expect(element.add).not.toHaveBeenCalled()
    })
  })
})
