import draw2d from 'draw2d'
import SerializationManager from '../SerializationManager'
import Editor from '../../core/Editor'
import Connection from '../../core/Connection'
import { Circuit } from '@aristotle/logic-circuit'
import LogicGate from '../../elements/LogicGate'
import Switch from '../../elements/Switch'
import Lightbulb from '../../elements/Lightbulb'

jest.mock('../../core/Editor')

describe('Serialization Manager', () => {
  let manager
  let editor
  let a, b, c, gate

  function getConnection (source, target, index) {
    const connection = new Connection(new Circuit())

    connection.setSource(source.getOutputPort(0))
    connection.setTarget(target.getInputPort(index))

    return connection
  }

  beforeEach(() => {
    editor = new Editor('testEditor')
    manager = new SerializationManager(editor)

    // set up the editor state
    a = new Switch('A', {}) as draw2d.Figure
    b = new Switch('B', {}) as draw2d.Figure
    gate = new LogicGate('gate', {}) as draw2d.Figure
    c = new Lightbulb('C', {}) as draw2d.Figure

    a.x = 0
    a.y = 0
    b.x = 100
    b.y = 0
    c.x = 200
    c.y = 200
    gate.x = 0
    gate.y = 100
  })

  describe('serializeAll()', () => {
    it('should contain a list of all elements and connections in the editor', () => {
      const figures = new draw2d.util.ArrayList()

      figures.add(a)
      figures.add(b)
      figures.add(c)
      figures.add(gate)

      const connections = new draw2d.util.ArrayList()

      connections.add(getConnection(a, gate, 0))
      connections.add(getConnection(b, gate, 1))
      connections.add(getConnection(gate, c, 0))

      jest
        .spyOn(editor, 'getFigures')
        .mockReturnValue(figures)
      jest
        .spyOn(editor, 'getLines')
        .mockReturnValue(connections)

      const serialized = manager.serializeAll()

      // assert proper connections
      expect(serialized).toHaveProperty('connections')
      expect(serialized.connections).toHaveLength(3)
      expect(serialized.connections[0].inputId).toEqual('A')
      expect(serialized.connections[0].outputId).toEqual('gate')
      expect(serialized.connections[1].inputId).toEqual('B')
      expect(serialized.connections[1].outputId).toEqual('gate')
      expect(serialized.connections[2].inputId).toEqual('gate')
      expect(serialized.connections[2].outputId).toEqual('C')

      // assert proper figures and their data
      expect(serialized).toHaveProperty('elements')
      expect(serialized.elements).toHaveLength(4)
      expect(serialized.elements[0].id).toEqual('A')
      expect(serialized.elements[0].x).toEqual(0)
      expect(serialized.elements[1].id).toEqual('B')
      expect(serialized.elements[1].x).toEqual(100)
      expect(serialized.elements[1].y).toEqual(0)
      expect(serialized.elements[2].id).toEqual('C')
      expect(serialized.elements[2].x).toEqual(200)
      expect(serialized.elements[2].x).toEqual(200)
      expect(serialized.elements[3].id).toEqual('gate')
      expect(serialized.elements[3].x).toEqual(0)
      expect(serialized.elements[3].y).toEqual(100)
    })
  })

  describe('serializeSelection()', () => {
    it('should contain a list of all elements and connections in the editor', () => {
      const selection = new draw2d.util.ArrayList()

      selection.add(a)
      selection.add(b)
      selection.add(c)
      selection.add(gate)
      selection.add(getConnection(a, gate, 0))
      selection.add(getConnection(b, gate, 1))
      selection.add(getConnection(gate, c, 0))

      jest
        .spyOn(editor, 'getSelection')
        .mockReturnValue({
          getAll: () => selection
        })

      const serialized = manager.serializeSelection()

      // assert proper connections
      expect(serialized).toHaveProperty('connections')
      expect(serialized.connections).toHaveLength(3)
      expect(serialized.connections[0].inputId).toEqual('A')
      expect(serialized.connections[0].outputId).toEqual('gate')
      expect(serialized.connections[1].inputId).toEqual('B')
      expect(serialized.connections[1].outputId).toEqual('gate')
      expect(serialized.connections[2].inputId).toEqual('gate')
      expect(serialized.connections[2].outputId).toEqual('C')

      // assert proper figures and their data
      expect(serialized).toHaveProperty('elements')
      expect(serialized.elements).toHaveLength(4)
      expect(serialized.elements[0].id).toEqual('A')
      expect(serialized.elements[0].x).toEqual(0)
      expect(serialized.elements[1].id).toEqual('B')
      expect(serialized.elements[1].x).toEqual(100)
      expect(serialized.elements[1].y).toEqual(0)
      expect(serialized.elements[2].id).toEqual('C')
      expect(serialized.elements[2].x).toEqual(200)
      expect(serialized.elements[2].x).toEqual(200)
      expect(serialized.elements[3].id).toEqual('gate')
      expect(serialized.elements[3].x).toEqual(0)
      expect(serialized.elements[3].y).toEqual(100)
    })
  })
})
