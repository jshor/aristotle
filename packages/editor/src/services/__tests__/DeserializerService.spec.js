import { command } from 'draw2d'
import DeserializerService from '../DeserializerService'
import Switch from '../../elements/Switch'
import LogicGate from '../../elements/LogicGate'
import Lightbulb from '../../elements/Lightbulb'
import IntegratedCircuit from '../../elements/IntegratedCircuit'
import data from './__fixtures__/circuit.json'

describe('Deserializer Service', () => {
  let editor
  let service

  beforeEach(() => {
    editor = {
      commandStack: {
        execute: jest.fn()
      },
      
      createConnection () {
        return {
          setSource: jest.fn(),
          setTarget: jest.fn()
        }
      }
    }
    service = new DeserializerService(editor)
  })

  describe('deserialize()', () => {
    beforeEach(() => {
      jest.spyOn(service, 'createElement')
      jest.spyOn(service, 'createConnection')
      jest.spyOn(editor.commandStack, 'execute')

      service.deserialize(data)  
    })

    it('should instantiate a new command collection', () => {
      expect(service).toHaveProperty('commandCollection')
      expect(service.commandCollection).toBeInstanceOf(command.CommandCollection)
    })

    it('should create an id re-mapping of all element ids', () => {
      expect(service).toHaveProperty('idMap')
      expect(Object.keys(service.idMap)).toHaveLength(data.elements.length)
    })

    it('should assign an element for each entry in the list', () => {
      expect(service.createElement).toHaveBeenCalledTimes(data.elements.length)
    })

    it('should assign a connection for each entry in the list', () => {
      expect(service.createConnection).toHaveBeenCalledTimes(data.connections.length)
    })

    it('should execute the command', () => {
      expect(service.editor.commandStack.execute).toHaveBeenCalledTimes(1)
      expect(service.editor.commandStack.execute).toHaveBeenCalledWith(service.commandCollection)
    })
  })

  describe('createElement()', () => {
    const element = { id: 1 }

    beforeEach(() => {
      jest
        .spyOn(service, 'getInitializedElement')
        .mockReturnValue(element)

      service.idMap = {}
      service.elements = []
      service.commandCollection = {
        add: jest.fn()
      }
    })

    it('should add a new element onto the array of elements', () => {
      service.createElement({ x: 1, y: 2 })
      expect(service.elements).toContain(element)
    })

    it('should add the `CommandAdd` to the collection', () => {
      jest.spyOn(service.commandCollection, 'add')
      service.createElement({ x: 1, y: 2 })

      expect(service.commandCollection.add).toHaveBeenCalledTimes(1)
      expect(service.commandCollection.add).toHaveBeenCalledWith(expect.any(command.CommandAdd))
    })
  })

  describe('getInitializedElement()', () => {
    const id = '123456'

    it('should return an IntegratedCircuit', () => {
      expect(service.getInitializedElement(id, {
        type: 'IntegratedCircuit',
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

    it('should return a Switch', () => {
      expect(service.getInitializedElement(id, {
        type: 'Switch'
      })).toBeInstanceOf(Switch)
    })

    it('should default to a generic Element', () => {
      expect(service.getInitializedElement(id, {
        type: 'Unknown'
      }).constructor.name).toEqual('Element')
    })
  })
})