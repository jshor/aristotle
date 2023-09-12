import Circuit from '../'
import InputNode from '../InputNode'
import CircuitNode from '../CircuitNode'
import Connection from '../Connection'
import LogicValue from '@/types/enums/LogicValue'
import Nor from '../gates/Nor'

describe('Circuit', () => {
  let circuit: Circuit

  beforeEach(() => {
    circuit = new Circuit()
  })

  afterEach(() => jest.resetAllMocks())

  describe('addNode()', () => {
    describe('when the node is an InputNode', () => {
      let node: CircuitNode

      beforeEach(() => {
        node = new InputNode('MY_INPUT')
      })

      it('should add it to the input list', () => {
        circuit.addNode(node)

        expect(circuit.inputNodes).toContain(node)
      })

      it('should update the queue with the node', () => {
        jest.spyOn(circuit, 'enqueue')
        circuit.addNode(node)

        expect(circuit.enqueue).toHaveBeenCalledTimes(1)
        expect(circuit.enqueue).toHaveBeenCalledWith(node)
      })

      it('should add it to the nodes list', () => {
        circuit.addNode(node)

        expect(circuit.nodes).toContain(node)
      })
    })

    describe('when the node is not an InputNode', () => {
      let node: Nor

      beforeEach(() => {
        node = new Nor('NOR_1')
      })

      it('should not update the queue', () => {
        jest.spyOn(circuit, 'enqueue')
        circuit.addNode(node)

        expect(circuit.enqueue).not.toHaveBeenCalled()
      })

      it('should add it to the nodes list', () => {
        circuit.addNode(node)

        expect(circuit.nodes).toContain(node)
      })
    })
  })

  describe('removeNode()', () => {
    describe('when the node is an InputNode', () => {
      let node: InputNode

      beforeEach(() => {
        node = new InputNode('MY_INPUT')
        circuit.nodes.push(node)
      })

      it('should remove it from the input list', () => {
        circuit.inputNodes.push(node)
        circuit.removeNode(node)

        expect(circuit.inputNodes).not.toContain(node)
      })

      it('should call `removeNodeOutputs()` with the given node', () => {
        jest.spyOn(circuit, 'removeNodeOutputs')
        circuit.removeNode(node)

        expect(circuit.removeNodeOutputs).toHaveBeenCalledTimes(1)
        expect(circuit.removeNodeOutputs).toHaveBeenCalledWith(node)
      })

      it('should step the circuit', () => {
        jest.spyOn(circuit, 'advance')
        circuit.removeNode(node)

        expect(circuit.advance).toHaveBeenCalledTimes(1)
      })

      it('should remove it from, the nodes list', () => {
        circuit.removeNode(node)

        expect(circuit.nodes).not.toContain(node)
      })
    })

    describe('when the node is not an InputNode', () => {
      let node: Nor

      beforeEach(() => {
        node = new Nor('NOR_1')
        circuit.addNode(node)
      })

      it('should call `removeNodeOutputs()` with the given node', () => {
        jest.spyOn(circuit, 'removeNodeOutputs')
        circuit.removeNode(node)

        expect(circuit.removeNodeOutputs).toHaveBeenCalledTimes(1)
        expect(circuit.removeNodeOutputs).toHaveBeenCalledWith(node)
      })

      it('should not reset the circuit', () => {
        jest.spyOn(circuit, 'reset')
        circuit.removeNode(node)

        expect(circuit.reset).not.toHaveBeenCalled()
      })

      it('should remove it from, the nodes list', () => {
        circuit.removeNode(node)

        expect(circuit.nodes).not.toContain(node)
      })
    })
  })

  describe('addConnection()', () => {
    let sourceNode: CircuitNode
    let targetNode: CircuitNode
    let dummyNode: CircuitNode

    beforeEach(() => {
      sourceNode = new InputNode('MY_INPUT')
      targetNode = new Nor('NOR_1')
      dummyNode = new Nor('NOR_2')

      jest
        .spyOn(circuit, 'advance')
        .mockImplementation(jest.fn())

      circuit.addNode(sourceNode)
      circuit.addNode(targetNode)
      circuit.addNode(dummyNode)
      circuit.addConnection(sourceNode, dummyNode, dummyNode.name)
    })

    it('should not add a new connection to the outputs if the target does not exist', () => {
      expect(sourceNode.outputs).toHaveLength(1)

      circuit.addConnection(sourceNode, null!, targetNode.name)

      expect(sourceNode.outputs).toHaveLength(1)
    })

    it('should add a new connection entry to the source node outputs list', () => {
      expect(sourceNode.outputs).toHaveLength(1)

      circuit.addConnection(sourceNode, targetNode, targetNode.name)

      expect(sourceNode.outputs).toHaveLength(2)
      expect(sourceNode.outputs[1]).toBeInstanceOf(Connection)
      expect(sourceNode.outputs[1].node).toEqual(targetNode)
    })

    it('should set the source node value to hi-Z', () => {
      circuit.addConnection(sourceNode, targetNode, targetNode.name)

      expect(sourceNode.value).toEqual(LogicValue.UNKNOWN)
    })

    it('should update the queue with the source node', () => {
      jest.spyOn(circuit, 'enqueue')
      circuit.addConnection(sourceNode, targetNode, targetNode.name)

      expect(circuit.enqueue).toHaveBeenCalledTimes(1)
      expect(circuit.enqueue).toHaveBeenCalledWith(sourceNode)
    })
  })

  describe('removeConnection()', () => {
    let sourceNode: CircuitNode
    let targetNode: CircuitNode
    let dummyNode: CircuitNode

    const sourceIndex = 1
    const targetIndex = 0

    beforeEach(() => {
      sourceNode = new InputNode('MY_INPUT')
      targetNode = new Nor('NOR_1')
      dummyNode = new Nor('NOR_2')

      /* stub each node's update methods */
      targetNode.update = jest.fn()
      sourceNode.update = jest.fn()
      dummyNode.update = jest.fn()

      sourceNode.outputs.push(new Connection(dummyNode, dummyNode.name))
      sourceNode.outputs.push(new Connection(targetNode, targetNode.name))

      jest
        .spyOn(circuit, 'advance')
        .mockImplementation(jest.fn())
    })

    it('should update the target node\'s value to hi-Z', () => {
      jest.spyOn(targetNode, 'update')
      circuit.removeConnection(sourceNode, targetNode)

      expect(targetNode.update).toHaveBeenCalledTimes(1)
      expect(targetNode.update).toHaveBeenCalledWith(LogicValue.UNKNOWN, 'NOR_1')
    })

    it('should remove the connection from the source node\'s outputs list', () => {
      expect(sourceNode.outputs[sourceIndex]).toBeInstanceOf(Connection)
      expect(sourceNode.outputs[sourceIndex].node).toEqual(targetNode)

      circuit.removeConnection(sourceNode, targetNode)

      expect(sourceNode.outputs[sourceIndex]).not.toBeDefined()
    })

    it('should update the queue with the target node', () => {
      jest.spyOn(circuit, 'enqueue')
      circuit.removeConnection(sourceNode, targetNode)

      expect(circuit.enqueue).toHaveBeenCalledTimes(1)
      expect(circuit.enqueue).toHaveBeenCalledWith(targetNode)
    })
  })

  describe('removeNodeOutputs()', () => {
    beforeEach(() => {
      jest
        .spyOn(circuit, 'removeConnection')
        .mockImplementation(jest.fn())
    })

    it('should call `removeConnection()` for each of the node\'s outputs', () => {
      const node1 = new Nor('NOR_1')
      const node2 = new Nor('NOR_2')
      const source = new Nor('SOURCE_NODE')

      source.outputs.push(new Connection(node1, 'c1'))
      source.outputs.push(new Connection(node2, 'c2'))

      circuit.removeNodeOutputs(source)

      expect(circuit.removeConnection).toHaveBeenCalledTimes(2)
      expect(circuit.removeConnection).toHaveBeenCalledWith(source, node1)
      expect(circuit.removeConnection).toHaveBeenCalledWith(source, node2)
    })
  })

  describe('enqueue()', () => {
    const node = new Nor('NOR_1')

    it('should add the node to the queue when not already present in queue', () => {
      circuit.enqueue(node)

      expect(circuit.queue).toHaveLength(1)
      expect(circuit.queue).toContain(node)
    })

    it('should not add a duplicate entry for the the node when already present in queue', () => {
      circuit.queue.push(node)
      circuit.enqueue(node)

      expect(circuit.queue).toHaveLength(1)
      expect(circuit.queue).toContain(node)
    })
  })

  describe('dequeue()', () => {
    const node1 = new Nor('NOR_1')
    const node2 = new Nor('NOR_2')

    it('should remove the node if it exists in the queue', () => {
      circuit.queue.push(node1)
      circuit.queue.push(node2)
      circuit.dequeue(node1)

      expect(circuit.queue).toHaveLength(1)
      expect(circuit.queue).toContain(node2)
    })

    it('should leave the queue intact if the node doesn\'t exist in the queue', () => {
      circuit.queue.push(node2)
      circuit.dequeue(node1)

      expect(circuit.queue).toHaveLength(1)
      expect(circuit.queue).toContain(node2)
    })
  })

  describe('reset()', () => {
    it('should reset each node in the circuit', () => {
      const node1 = new Nor('NOR_1')
      const node2 = new Nor('NOR_2')

      jest.spyOn(node1, 'reset')
      jest.spyOn(node2, 'reset')

      circuit.nodes = [node1, node2]
      circuit.reset()

      expect(node1.reset).toHaveBeenCalledTimes(1)
      expect(node2.reset).toHaveBeenCalledTimes(1)
    })
  })

  describe('next()', () => {
    let node1: Nor
    let node2: Nor

    beforeEach(() => {
      node1 = new Nor('NOR_1')
      node2 = new Nor('NOR_2')

      node1.propagate = jest.fn(() => ([]))
      node2.propagate = jest.fn(() => ([]))

      jest
        .spyOn(circuit, 'enqueue')
        .mockImplementation(jest.fn())
        jest
          .spyOn(circuit, 'dequeue')
          .mockImplementation(jest.fn())
      jest.spyOn(circuit, 'advance')

      circuit.queue = [node1, node2]
    })

    describe('when the circuit is incomplete after processing', () => {
      beforeEach(() => {
        circuit.queue = [new CircuitNode('node1')]
      })

      describe('when one of the nodes\' values have changed', () => {
        it('should step the circuit again', () => {
          node1.isValueChanged = true
          node2.isValueChanged = false

          circuit.advance()

          expect(circuit.advance).toHaveBeenCalledTimes(1)
        })
      })

      it('should enqueue nodes when a node is forced to continue', () => {
        const node = new CircuitNode('node')

        node.forceContinue = true
        circuit.queue = [node]
        circuit.advance()

        expect(circuit.enqueue).toHaveBeenCalledTimes(2)
      })

      it('should not enqueue any nodes if the active node has been removed from the circuit', () => {
        circuit.queue = [null!]
        circuit.advance()

        expect(circuit.enqueue).not.toHaveBeenCalled()
      })
    })

    describe('when the circuit is complete', () => {
      it('should not step the circuit again', () => {
        circuit.queue = []
        circuit.advance()

        expect(circuit.advance).toHaveBeenCalledTimes(1)
      })
    })
  })
})
