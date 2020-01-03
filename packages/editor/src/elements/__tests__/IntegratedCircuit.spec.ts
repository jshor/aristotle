import { InputNode, Buffer } from '@aristotle/logic-circuit'
import IntegratedCircuit from '../IntegratedCircuit'
import LogicGate from '../LogicGate'
import Connection from '../../Connection'
import fixture from './__fixtures__/ic.json'

describe('Integrated Circuit', () => {
  let ic

  beforeEach(() => {
    ic = new IntegratedCircuit(fixture.id, fixture)
    jest
      .spyOn(Connection.prototype, 'on')
      .mockImplementation(jest.fn())
  })
  
  /** mock connection creation */
  const connect = (source, target) => {
    const connection = new Connection()

    connection.setSource(source.getOutputPort(0))
    connection.setTarget(target.getInputPort(0))

    return connection
  }

  it('should be an instance of `IntegratedCircuit`', () => {
    expect(ic).toBeInstanceOf(IntegratedCircuit)
  })

  describe('getCircuitNodeId()', () => {

    it('should return the id of a node that is an input', () => {
      const inputNode = new LogicGate('123', { subtype: 'OR' })
      const connection = connect(inputNode, ic)

      expect(ic.getCircuitNodeId(connection)).toEqual('aqLvQGuk27')
    })

    it('should return the id of a node that is an output', () => {
      const outputNode = new LogicGate('123', { subtype: 'OR' })
      const connection = connect(ic, outputNode)

      expect(ic.getCircuitNodeId(connection)).toEqual('c5XCJ9eill')
    })
  })

  describe('getCircuitNodeById()', () => {
    it('should return the correct node', () => {
      const name = 'aqLvQGuk27'
      ic.nodes = [{ name: 1 }, { name }, { name: 2 }]
      const node = ic.getCircuitNodeById(name)

      expect(node.name).toEqual(name)
    })
  })

  describe('getNodeListByType()', () => {
    it('should define `inputIds` as a list of ids of the input elements', () => {
      expect(ic).toHaveProperty('inputIds')
      expect(Array.isArray(ic.inputIds)).toBe(true)
      expect(ic.inputIds).toHaveLength(2)
      expect(ic.inputIds).toEqual(['aqLvQGuk27', 'VEFvl5BKys'])
    })

    it('should define `outputIds` as a list of ids of the output elements', () => {
      expect(ic).toHaveProperty('outputIds')
      expect(Array.isArray(ic.outputIds)).toBe(true)
      expect(ic.outputIds).toHaveLength(2)
      expect(ic.outputIds).toEqual(['c5XCJ9eill', 'XNTLeHX6dZ'])
    })
  })

  describe('getInitializedNode()', () => {
    describe('when the node is an input or an output', () => {
      it('should treat the input as a buffer', () => {
        const node = ic.getInitializedNode({ id: 1, nodeType: 'input', portIndex: 0 })

        expect(node).toBeDefined()
        expect(node).toBeInstanceOf(Buffer)
      })
      
      it('should treat the output as a buffer', () => {
        const node = ic.getInitializedNode({ id: 1, nodeType: 'output', portIndex: 0 })

        expect(node).toBeDefined()
        expect(node).toBeInstanceOf(Buffer)
      })
      
      xit('should assign the `change` event to call `updateWireColor` on an output node', () => {
        jest.spyOn(Buffer.prototype, 'on')

        const node = ic.getInitializedNode({ id: 1, nodeType: 'output', portIndex: 0 })

        expect(Buffer.prototype.on).toHaveBeenCalledTimes(1)
        expect(Buffer.prototype.on).toHaveBeenCalledWith('change', expect.any(ic.updateWireColor))
      })
      
      it('should assign `forceContinue` to the node', () => {
        const node = ic.getInitializedNode({ id: 1, nodeType: 'output', portIndex: 0 })

        expect(node).toHaveProperty('forceContinue')
        expect(node.forceContinue).toEqual(true)
      })
    })
  })

  describe('buildCircuit()', () => {
    beforeEach(() => {
      ic.canvas = {
        circuit: {
          addConnection: jest.fn(),
          addNode: jest.fn()
        }
      }
      
      jest.spyOn(ic.canvas.circuit, 'addConnection')
    })

    it('should add the element for each element entry in the set', () => {
      ic.buildCircuit()

      expect(ic.canvas.circuit.addNode).toHaveBeenCalledTimes(ic.elementEntries.length)
    })

    it('should add the connection for each connection entry in the set', () => {
      ic.buildCircuit()

      expect(ic.canvas.circuit.addConnection).toHaveBeenCalledTimes(ic.connectionEntries.length)
    })
  })
})