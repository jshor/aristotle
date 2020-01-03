import Connection from './Connection'
import Switch from './elements/Switch'
import Lightbulb from './elements/Lightbulb'
import Element from './Element'


describe('Connection', () => {
  let source, target, connection

  const sourceNode = { type: 'input' }
  const targetNode = { type: 'output' }
  const canvas = new Element()

  const circuit = {
    addConnection: jest.fn(),
    removeConnection: jest.fn()
  }

  beforeEach(() => {
    source = new Switch('testSwitch')
    target = new Lightbulb('testSwitch')
    connection = new Connection(circuit)

    source.getCircuitNode = () => sourceNode
    target.getCircuitNode = () => targetNode

    connection.setSource(source.getOutputPort(0))
    connection.setTarget(target.getInputPort(0))
    connection.canvas = { step: jest.fn() }
  })

  afterEach(() => jest.resetAllMocks())

  describe('addCircuitConnection()', () => {
    beforeEach(() => connection.addCircuitConnection())

    it('should connect the circuit nodes of the source and targets in the circuit instance', () => {
      expect(circuit.addConnection).toHaveBeenCalledTimes(1)
      expect(circuit.addConnection).toHaveBeenCalledWith(sourceNode, targetNode, 0)
    })

    it('should trigger the circuit', () => {
      expect(connection.canvas.step).toHaveBeenCalledTimes(1)
      expect(connection.canvas.step).toHaveBeenCalledWith(true)
    })
  })

  describe('removeCircuitConnection()', () => {
    it('should connect the circuit nodes of the source and targets in the circuit instance', () => {
      connection.removeCircuitConnection()

      expect(circuit.removeConnection).toHaveBeenCalledTimes(1)
      expect(circuit.removeConnection).toHaveBeenCalledWith(sourceNode, targetNode)
    })
  })

  describe('serialize()', () => {
    it('should return the ids and indices of their respective source and target', () => {
      const data = connection.serialize()

      expect(data).toHaveProperty('inputId')
      expect(data).toHaveProperty('outputId')
      expect(data).toHaveProperty('sourceIndex')
      expect(data).toHaveProperty('targetIndex')
      expect(data.inputId).toEqual(source.id)
      expect(data.outputId).toEqual(target.id)
      expect(data.sourceIndex).toEqual(0)
      expect(data.targetIndex).toEqual(0)
    })
  })
})
