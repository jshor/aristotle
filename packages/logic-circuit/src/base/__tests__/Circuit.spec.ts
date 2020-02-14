import Circuit from '../Circuit'
import InputNode from '../InputNode'
import CircuitNode from '../CircuitNode'
import Connection from '../../types/Connection'
import LogicValue from '../../types/LogicValue'
import Nor from '../../gates/Nor'

describe('Circuit', () => {
  let circuit: Circuit

  beforeEach(() => {
    circuit = new Circuit()
  })

  afterEach(() => jest.resetAllMocks())

  describe('addNode()', () => {
    describe('when the node is an InputNode', () => {
      let node

      beforeEach(() => {
        node = new InputNode('MY_INPUT')
      })

      it('should add it to the input list', () => {
        circuit.addNode(node)

        expect(circuit.inputs).toContain(node)
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
      let node

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
      let node

      beforeEach(() => {
        node = new InputNode('MY_INPUT')
        circuit.nodes.push(node)
      })

      it('should remove it from the input list', () => {
        circuit.inputs.push(node)
        circuit.removeNode(node)

        expect(circuit.inputs).not.toContain(node)
      })

      it('should reset the circuit', () => {
        jest.spyOn(circuit, 'reset')
        circuit.removeNode(node)

        expect(circuit.reset).toHaveBeenCalledTimes(1)
      })

      it('should call `removeNodeOutputs()` with the given node', () => {
        jest.spyOn(circuit, 'removeNodeOutputs')
        circuit.removeNode(node)

        expect(circuit.removeNodeOutputs).toHaveBeenCalledTimes(1)
        expect(circuit.removeNodeOutputs).toHaveBeenCalledWith(node)
      })

      it('should step the circuit', () => {
        jest.spyOn(circuit, 'next')
        circuit.removeNode(node)

        expect(circuit.next).toHaveBeenCalledTimes(1)
      })

      it('should remove it from, the nodes list', () => {
        circuit.removeNode(node)

        expect(circuit.nodes).not.toContain(node)
      })
    })

    describe('when the node is not an InputNode', () => {
      let node

      beforeEach(() => {
        node = new Nor('NOR_1')
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

      it('should step the circuit', () => {
        jest.spyOn(circuit, 'next')
        circuit.removeNode(node)

        expect(circuit.next).toHaveBeenCalledTimes(1)
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
        .spyOn(circuit, 'next')
        .mockImplementation(jest.fn())

      circuit.addNode(sourceNode)
      circuit.addNode(targetNode)
      circuit.addNode(dummyNode)
      circuit.addConnection(sourceNode, dummyNode, 0)
    })

    it('should add a new connection entry to the source node outputs list', () => {
      expect(sourceNode.outputs).toHaveLength(1)

      circuit.addConnection(sourceNode, targetNode, 0)

      expect(sourceNode.outputs).toHaveLength(2)
      expect(sourceNode.outputs[1]).toBeInstanceOf(Connection)
      expect(sourceNode.outputs[1].node).toEqual(targetNode)
      expect(sourceNode.outputs[1].index).toEqual(0)
    })

    it('should set the source node value to hi-Z', () => {
      circuit.addConnection(sourceNode, targetNode, 0)

      expect(sourceNode.value).toEqual(LogicValue.UNKNOWN)
    })

    it('should update the queue with the source node', () => {
      jest.spyOn(circuit, 'enqueue')
      circuit.addConnection(sourceNode, targetNode, 0)

      expect(circuit.enqueue).toHaveBeenCalledTimes(1)
      expect(circuit.enqueue).toHaveBeenCalledWith(sourceNode)
    })

    it('should step the circuit', () => {
      jest.spyOn(circuit, 'next')
      circuit.addConnection(sourceNode, targetNode, 0)

      expect(circuit.next).toHaveBeenCalled()
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

      sourceNode.outputs.push(new Connection(dummyNode, targetIndex))
      sourceNode.outputs.push(new Connection(targetNode, targetIndex))

      jest
        .spyOn(circuit, 'next')
        .mockImplementation(jest.fn())
    })

    it('should update the target node\'s value to hi-Z', () => {
      jest.spyOn(targetNode, 'update')
      circuit.removeConnection(sourceNode, targetNode)

      expect(targetNode.update).toHaveBeenCalledTimes(1)
      expect(targetNode.update).toHaveBeenCalledWith(LogicValue.UNKNOWN, targetIndex)
    })

    it('should remove the connection from the source node\'s outputs list', () => {
      expect(sourceNode.outputs[sourceIndex]).toBeInstanceOf(Connection)
      expect(sourceNode.outputs[sourceIndex].node).toEqual(targetNode)

      circuit.removeConnection(sourceNode, targetNode)

      expect(sourceNode.outputs[sourceIndex]).not.toBeDefined()
    })

    it('should update the queue with the source and target nodes', () => {
      jest.spyOn(circuit, 'enqueue')
      circuit.removeConnection(sourceNode, targetNode)

      expect(circuit.enqueue).toHaveBeenCalledTimes(1)
      expect(circuit.enqueue).toHaveBeenCalledWith(sourceNode, targetNode)
    })

    it('should step the circuit', () => {
      circuit.removeConnection(sourceNode, targetNode)

      expect(circuit.next).toHaveBeenCalledTimes(1)
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

      source.outputs.push(new Connection(node1, 0))
      source.outputs.push(new Connection(node2, 0))

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
    let node1
    let node2

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
      jest.spyOn(circuit, 'next')

      circuit.queue = [node1, node2]
    })

    describe('when the circuit is incomplete after processing', () => {
      beforeEach(() => {
        let nextCallCount = 0

        jest
          .spyOn(circuit, 'isComplete')
          .mockReturnValue(() => ++nextCallCount > 2)
      })

      describe('when one of the nodes\' values have changed', () => {
        it('should step the circuit again', () => {
          node1.isValueChanged = true
          node2.isValueChanged = false

          circuit.next()

          expect(circuit.next).toHaveBeenCalledTimes(1)
        })
      })
      
      describe('when none of the nodes\' values have changed', () => {
        it('should not step the circuit again', () => {
          node1.isValueChanged = false
          node2.isValueChanged = false

          circuit.next()

          expect(circuit.next).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('when the circuit is complete', () => {
      it('should not step the circuit again', () => {
        jest
          .spyOn(circuit, 'isComplete')
          .mockReturnValue(true)
          
        circuit.next()

        expect(circuit.next).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('isComplete()', () => {
    it('should return false when the queue is nonempty', () => {
      circuit.queue = [new Nor('NOR')]

      expect(circuit.isComplete()).toEqual(false)
    })
    
    it('should return true when the queue is empty', () => {
      circuit.queue = []

      expect(circuit.isComplete()).toEqual(true)
    })
  })
})
