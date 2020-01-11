import { command } from 'draw2d'
import DeserializerService from '../DeserializerService'
import data from './__fixtures__/circuit.json'
import ElementInitializerService from '../ElementInitializerService'
import Editor from '../../core/Editor'

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

describe('Deserializer Service', () => {
  let editor
  let service

  beforeEach(() => {
    editor = new Editor('testEditor')
    service = new DeserializerService(editor)
  })

  afterEach(() => jest.resetAllMocks())

  describe('deserialize()', () => {
    beforeEach(() => {
      jest.spyOn(service, 'createElement')
      jest.spyOn(service, 'createConnection')

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
      const commandStack = editor.getCommandStack()

      jest.spyOn(commandStack, 'execute')

      expect(commandStack.execute).toHaveBeenCalledTimes(1)
      expect(commandStack.execute).toHaveBeenCalledWith(service.commandCollection)
    })
  })

  describe('createElement()', () => {
    const element = { id: 1 }

    beforeEach(() => {
      jest
        .spyOn(ElementInitializerService, 'getInitializedElement')
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
})
