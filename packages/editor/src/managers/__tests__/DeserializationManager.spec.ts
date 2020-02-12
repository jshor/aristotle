import draw2d from 'draw2d'
import DeserializationManager from '../DeserializationManager'
import data from './__fixtures__/circuit.json'
import Editor from '../../core/Editor'
import Connection from '../../core/Connection'
import Element from '../../core/Element'
import { CircuitElement } from '../../types'
import Switch from '../../elements/Switch'
import LogicGate from '../../elements/LogicGate'
import Clock from '../../elements/Clock'
import Lightbulb from '../../elements/Lightbulb'
import Digit from '../../elements/Digit'
import IntegratedCircuit from '../../elements/IntegratedCircuit'

jest.mock('../../core/Editor', () => {
  const commandStack = {
    execute: jest.fn()
  }

  return class Editor {
    getCommandStack () {
      return commandStack
    }

    createConnection () {
      return {
        setSource: jest.fn(),
        setTarget: jest.fn()
      }
    }
  }
})

describe('Deserialization Manager', () => {
  let editor
  let manager

  beforeEach(() => {
    editor = new Editor('testEditor')
    manager = new DeserializationManager(editor)
  })

  afterEach(() => jest.resetAllMocks())

  describe('deserialize()', () => {
    beforeEach(() => {
      jest.spyOn(manager, 'createElement')
      jest.spyOn(manager, 'createConnection')
      jest
        .spyOn(manager, 'executeAllCommands')
        .mockImplementation(jest.fn())

      manager.deserialize(data)
    })

    it('should instantiate a new command collection', () => {
      expect(manager).toHaveProperty('commandCollection')
      expect(manager.commandCollection).toBeInstanceOf(draw2d.command.CommandCollection)
    })

    it('should create an id re-mapping of all element ids', () => {
      expect(manager).toHaveProperty('idMap')
      expect(Object.keys(manager.idMap)).toHaveLength(data.elements.length)
    })

    it('should assign an element for each entry in the list', () => {
      expect(manager.createElement).toHaveBeenCalledTimes(data.elements.length)
    })

    it('should assign a connection for each entry in the list', () => {
      expect(manager.createConnection).toHaveBeenCalledTimes(data.connections.length)
    })
  })

  describe('executeAllCommands()', () => {
    it('should execute the commands', () => {
      manager.commandCollection = new draw2d.command.CommandCollection()
      manager.canvas.commandStack = {
        execute: jest.fn()
      }

      const spy = jest.spyOn(manager.canvas.commandStack, 'execute')

      manager.executeAllCommands()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(manager.commandCollection)
    })
  })

  describe('getInitializedElement()', () => {
    const id = '123456'

    it('should return an IntegratedCircuit element', () => {
      expect(manager.getInitializedElement(id, 'IntegratedCircuit', {
        name: 'Test Circuit',
        elements: [],
        connections: [],
        ports: {
          top: [],
          bottom: [],
          left: [],
          right: []
        }
      })).toBeInstanceOf(IntegratedCircuit)
    })

    it('should return a Clock element', () => {
      expect(manager.getInitializedElement(id, 'Clock', {})).toBeInstanceOf(Clock)
    })

    it('should return a Switch element', () => {
      expect(manager.getInitializedElement(id, 'Switch', {})).toBeInstanceOf(Switch)
    })

    it('should return a Lightbulb element', () => {
      expect(manager.getInitializedElement(id, 'Lightbulb', {})).toBeInstanceOf(Lightbulb)
    })

    it('should return a Digit element', () => {
      expect(manager.getInitializedElement(id, 'Digit', {})).toBeInstanceOf(Digit)
    })

    it('should return a LogicGate element', () => {
      expect(manager.getInitializedElement(id, 'LogicGate', {
        gateType: 'NOR'
      })).toBeInstanceOf(LogicGate)
    })

    it('should default to a generic Element if the `type` is not recognized', () => {
      expect(manager.getInitializedElement(id, 'Unknown', {})).toBeInstanceOf(Element)
    })
  })

  // describe('connectElements()', () => {
  //   const source: any = new Element('12345', {})
  //   const target: any = new Element('12346', {})
  //   const outputPort = new draw2d.Port()
  //   const inputPort = new draw2d.Port()
  //   const index = 1

  //   beforeEach(() => {
  //     jest
  //       .spyOn(Connection.prototype as draw2d.Connection, 'setSource')
  //       .mockImplementation(jest.fn())

  //     jest
  //       .spyOn(Connection.prototype as draw2d.Connection, 'setTarget')
  //       .mockImplementation(jest.fn())

  //     source.getOutputPort = jest.fn(() => outputPort)
  //     source.getInputPort = jest.fn(() => inputPort)
  //   })

  //   it('should set the output port to the 0th index of the source', () => {
  //     editor.connectElements(source, target, index)

  //     expect(source.getOutputPort).toHaveBeenCalledWith(0)
  //   })

  //   it('should set the input port to the index-th of the target', () => {
  //     editor.connectElements(source, target, index)

  //     expect(target.getInputPort).toHaveBeenCalledWith(index)
  //   })

  //   it('should add the connection to the editor instance', () => {
  //     const spy = jest.spyOn(Editor.prototype as draw2d.Canvas, 'add')

  //     editor.connectElements(source, target, index)

  //     expect(spy).toHaveBeenCalledTimes(1)
  //     expect(spy).toHaveBeenCalledWith(expect.any(Connection))
  //   })

  //   it('should step the circuit', () => {
  //     const spy = jest.spyOn(editor, 'step')
  //     editor.connectElements(source, target, index)

  //     expect(spy).toHaveBeenCalledTimes(1)
  //     expect(spy).toHaveBeenCalledWith(true)
  //   })
  // })

  describe('createElement()', () => {
    const serializedElement: CircuitElement = {
      id: 'abc123',
      x: 1,
      y: 2,
      type: 'Switch',
      properties: {}
    }

    beforeEach(() => {
      manager.idMap = {}
      manager.elements = []
      manager.commandCollection = {
        add: jest.fn()
      }
    })

    xit('should add a new element onto the array of elements', () => {
      manager.createElement(serializedElement)

      expect(manager.elements).toContain(expect.any(Switch))
    })

    it('should add the `CommandAdd` to the collection', () => {
      jest.spyOn(manager.commandCollection, 'add')

      manager.createElement(serializedElement)

      expect(manager.commandCollection.add).toHaveBeenCalledTimes(1)
      expect(manager.commandCollection.add).toHaveBeenCalledWith(
        expect.any(draw2d.command.CommandAdd)
      )
    })
  })
})
