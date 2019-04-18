import { Port, policy } from 'draw2d'
import Canvas from '../Canvas'
import Editor from '../Editor'
import Connection from '../Connection'
import Element from '../Element'

jest.mock('../Canvas')
jest.mock('../Connection')

describe('Editor', () => {
  let editor

  beforeEach(() => {
    editor = new Editor('testElement')
  })

  afterEach(() => jest.resetAllMocks())

  describe('addNode()', () => {
    const node = new Element('12345', 'testElement')
    const x = 40
    const y = 60

    it('should add a node to the canvas', () => {
      const spy = jest.spyOn(editor, 'add')
      editor.addNode(node, x, y)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(node, x, y)
    })

    it('should add the node to the circuit instance', () => {
      const spy = jest.spyOn(editor.circuit, 'addNode')
      editor.addNode(node, x, y)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(node.node)
    })

    it('should step the circuit', () => {
      const spy = jest.spyOn(editor, 'step')
      editor.addNode(node, x, y)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(true)
    })
  })

  describe('addConnection()', () => {
    const source = new Element('12345', 'sourceElement')
    const target = new Element('12346', 'targetElement')
    const outputPort = new Port()
    const inputPort = new Port()
    const index = 1

    beforeEach(() => {
      jest
        .spyOn(Connection.prototype, 'setSource')
        .mockImplementation(jest.fn())
      jest
        .spyOn(Connection.prototype, 'setTarget')
        .mockImplementation(jest.fn())
      jest
        .spyOn(source, 'getOutputPort')
        .mockReturnValue(outputPort)
      jest
        .spyOn(target, 'getInputPort')
        .mockReturnValue(inputPort)
    })

    it('should set the output port to the 0th index of the source', () => {
      editor.addConnection(source, target, index)

      expect(source.getOutputPort).toHaveBeenCalledWith(0)
      expect(Connection.prototype.setSource).toHaveBeenCalledWith(outputPort)
    })

    it('should set the input port to the index-th of the target', () => {
      editor.addConnection(source, target, index)

      expect(target.getInputPort).toHaveBeenCalledWith(index)
      expect(Connection.prototype.setTarget).toHaveBeenCalledWith(inputPort)
    })

    it('should add the connection to the editor instance', () => {
      jest.spyOn(editor, 'add')
      editor.addConnection(source, target, index)

      expect(editor.add).toHaveBeenCalledWith(expect.any(Connection))
    })

    it('should step the circuit', () => {
      const spy = jest.spyOn(editor, 'step')
      editor.addConnection(source, target, index)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(true)
    })
  })

  describe('step()', () => {
    beforeEach(() => {
      jest.spyOn(editor, 'step')
      jest.spyOn(editor.circuit, 'next')
    })

    describe('in debug mode', () => {
      beforeEach(() => {
        editor.debug = true
      })

      describe('when the circuit starts incomplete', () => {
        let steps = 0

        beforeEach(() => {
          jest
            .spyOn(editor.circuit, 'isComplete')
            .mockImplementation(jest.fn(() => ++steps > 1))
        })

        it('should step the circuit until complete', () => {
          editor.step()

          expect(editor.circuit.next).toHaveBeenCalledTimes(1)
        })

        it('should call step() again until complete', () => {
          editor.step()

          expect(editor.step).toHaveBeenCalledTimes(1)
        })
      })

      describe('when the circuit is forced to update', () => {
        it('should step the circuit once', () => {
          editor.step(true)

          expect(editor.circuit.next).toHaveBeenCalledTimes(1)
        })

        it('should call step() once', () => {
          editor.step(true)

          expect(editor.step).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('in automatic mode', () => {
      beforeEach(() => {
        editor.debug = false
      })

      it('should step the circuit once', () => {
        editor.step(true)

        expect(editor.circuit.next).toHaveBeenCalledTimes(1)
      })

      it('should call step again', () => {
        editor.step(true)

        expect(editor.step).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('setMouseMode()', () => {
    beforeEach(() => {
      jest.spyOn(editor, 'installEditPolicy')
    })

    it('should install the panning selection policy when in `PANNING` mode', () => {
      editor.setMouseMode('PANNING')

      expect(editor.installEditPolicy).toHaveBeenCalledWith(
        expect.any(policy.canvas.PanningSelectionPolicy)
      )
    })

    it('should install the bounding box selection policy when in `SELECTION` mode', () => {
      editor.setMouseMode('SELECTION')

      expect(editor.installEditPolicy).toHaveBeenCalledWith(
        expect.any(policy.canvas.BoundingboxSelectionPolicy)
      )
    })
  })

  describe('createConnection()', () => {
    it('should return a new instance of `Connection`', () => {
      expect(editor.createConnection()).toBeInstanceOf(Connection)
    })
  })

  describe('policy installation', () => {
    beforeEach(() => {
      jest.spyOn(editor, 'installEditPolicy')
    })

    it('should install the drag-connection-edit policy', () => {
      expect(editor.installEditPolicy).toHaveBeenCalledWith(
        expect.any(policy.connection.DragConnectionCreatePolicy)
      )
    })
  })
})