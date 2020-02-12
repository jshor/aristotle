import draw2d from 'draw2d'
import Editor from '../Editor'
import Connection from '../Connection'
import Element from '../Element'

jest.mock('draw2d')
jest.mock('../Connection')
jest.mock('../../managers/OscillationManager', () => {
  return class {
    start = jest.fn()
    stop = jest.fn()
  }
})

describe('Editor', () => {
  let editor

  beforeEach(() => {
    editor = new Editor('testElement')
  })

  afterEach(() => jest.resetAllMocks())

  describe('registerCanvasDOM()', () => {
    beforeEach(() => {
      jest
        .spyOn(editor, 'registerEventListeners')
        .mockImplementation(jest.fn())
    })

    describe('when the parent DOM element (<canvas>) is assigned by draw2d', () => {
      const container = document.createElement('div')
      const canvas = document.createElement('canvas')
      let scrollAreaSpy


      container.appendChild(canvas)

      beforeEach(() => {
        scrollAreaSpy = jest
          .spyOn(Editor.prototype as draw2d.Canvas, 'setScrollArea')
          .mockImplementation(jest.fn())

        editor.html = [canvas]
        editor.registerCanvasDOM()
      })

      it('should set `wrapper` to the registered canvas element', () => {
        expect(editor.wrapper).toEqual(canvas)
      })

      it('should set `parent` to the container element', () => {
        expect(editor.parent).toEqual(container)
      })

      it('should call `setScrollArea` on the draw2d.Canvas instance with the parent element', () => {
        expect(scrollAreaSpy).toHaveBeenCalledTimes(1)
        expect(scrollAreaSpy).toHaveBeenCalledWith(editor.parent)
      })

      it('should register the event listeners', () => {
        expect(editor.registerEventListeners).toHaveBeenCalledTimes(1)
      })
    })

    describe('when the element is not defined', () => {
      it('should not register the event listeners', () => {
        expect(editor.registerEventListeners).not.toHaveBeenCalled()
      })
    })
  })

  describe('registerEventListeners()', () => {
    let commandStack

    beforeEach(() => {
      commandStack = {
        addEventListener: jest.fn()
      }
      editor.wrapper = {
        addEventListener: jest.fn()
      }

      jest.spyOn(document, 'addEventListener')
      jest
        .spyOn(Editor.prototype as draw2d.Canvas, 'getCommandStack')
        .mockReturnValue(commandStack)

      editor.registerEventListeners()
    })

    it('should attach the `mousemove` and  `mouseup` listeners', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('mousemove', editor.onBoundlessMouseMove)
      expect(document.addEventListener).toHaveBeenCalledWith('mouseup', editor.onBoundlessMouseUp)
    })

    it('should fire `commandStack:changed` when the command stack changes', () => {
      jest.spyOn(editor, 'fireEvent')
      jest
        .spyOn(commandStack, 'addEventListener')
        .mockImplementation((cb: Function) => cb())

      editor.registerEventListeners()

      expect(editor.fireEvent).toHaveBeenCalledTimes(1)
      expect(editor.fireEvent).toHaveBeenCalledWith('commandStack:changed')
    })
  })

  describe('onDeselect()', () => {
    beforeEach(() => {
      jest.spyOn(editor, 'fireEvent')
    })

    it('should fire `properties:close` when the selection is empty', () => {
      jest
        .spyOn(Editor.prototype as draw2d.Canvas, 'getSelection')
        .mockReturnValue({
          getSize: () => 0
        })
      editor.onDeselect()

      expect(editor.fireEvent).toHaveBeenCalledTimes(1)
      expect(editor.fireEvent).toHaveBeenCalledWith('properties:close')
    })

    it('should fire `deselect` when an item is present in the selection', () => {
      jest
        .spyOn(Editor.prototype as draw2d.Canvas, 'getSelection')
        .mockReturnValue({
          getSize: () => 1
        })
      editor.onDeselect()

      expect(editor.fireEvent).toHaveBeenCalledTimes(1)
      expect(editor.fireEvent).toHaveBeenCalledWith('deselect')
    })
  })

  describe('positioning handlers', () => {
    beforeEach(() => {
      const parent = document.createElement('div')

      document.body.appendChild(parent)
      editor.parent = parent
    })

    describe('getAbsoluteX()', () => {
      it('should return 0', () => {
        expect(editor.getAbsoluteX()).toEqual(0)
      })
    })

    describe('getAbsoluteY()', () => {
      it('should return 0', () => {
        expect(editor.getAbsoluteY()).toEqual(0)
      })
    })
  })

  describe('boundary policy handlers', () => {
    const event = {
      clientX: 20,
      clientY: 40,
      shiftKey: false,
      ctrlKey: false
    }
    let policy

    beforeEach(() => {
      policy = {
        onMouseDrag: jest.fn(),
        onMouseUp: jest.fn()
      }
      editor.editPolicy = {
        each: jest.fn((fn) => fn(0, policy))
      }
    })

    describe('onBoundlessMouseMove()', () => {
      describe('when the mouse is down', () => {
        beforeEach(() => {
          editor.mouseDown = true

          jest
            .spyOn(Editor.prototype as draw2d.Canvas, 'fromDocumentToCanvasCoordinate')
            .mockReturnValue({ x: 0, y: 0 })
        })

        it('should apply the computed canvas deltas on each mouse-down edit policy', () => {
          editor.onBoundlessMouseMove(event)

          expect(policy.onMouseDrag).toHaveBeenCalledTimes(1)
        })

        it('should fire the `mousemove` event', () => {
          jest.spyOn(editor, 'fireEvent')
          editor.onBoundlessMouseMove(event)

          expect(editor.fireEvent).toHaveBeenCalledTimes(1)
          expect(editor.fireEvent).toHaveBeenCalledWith('mousemove', expect.any(Object))
        })
      })

      describe('when the mouse is not down', () => {
        beforeEach(() => {
          editor.mouseDown = false
        })

        it('should not trigger any edit policies', () => {
          editor.onBoundlessMouseMove(event)

          expect(policy.onMouseDrag).not.toHaveBeenCalled()
        })

        it('should not fire any events', () => {
          jest.spyOn(editor, 'fireEvent')
          editor.onBoundlessMouseMove(event)

          expect(editor.fireEvent).not.toHaveBeenCalled()
        })
      })
    })

    describe('onBoundlessMouseUp()', () => {
      let spy

      beforeEach(() => {
        spy = jest
          .spyOn(Editor.prototype as draw2d.Canvas, 'fromDocumentToCanvasCoordinate')
          .mockReturnValue({ x: 0, y: 0 })
      })

      describe('when the mouse is down', () => {
        beforeEach(() => {
          editor.mouseDown = true
          editor.onBoundlessMouseUp(event)
        })

        it('should apply the computed canvas deltas on each mouse-down edit policy', () => {
          expect(policy.onMouseUp).toHaveBeenCalledTimes(1)
        })

        it('should recalculate the canvas intersection', () => {
          expect(spy).toHaveBeenCalledTimes(1)
        })

        it('should reset the `mouseDown` flag back to false', () => {
          expect(editor.mouseDown).toEqual(false)
        })

        it('should reset the mouse drag deltas', () => {
          expect(editor.mouseDragDiffX).toEqual(0)
          expect(editor.mouseDragDiffY).toEqual(0)
        })
      })

      describe('when the mouse is not down', () => {
        beforeEach(() => {
          editor.mouseDown = false
          editor.onBoundlessMouseUp(event)
        })

        it('should recalculate the canvas intersection', () => {
          expect(editor.calculateConnectionIntersection).not.toHaveBeenCalled()
        })

        it('should not trigger any edit policies', () => {
          expect(policy.onMouseUp).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('onDrop()', () => {
    const properties = {
      type: 'LogicGate',
      gateType: 'NOR'
    }
    const data = {
      params: btoa(JSON.stringify(properties))
    }
    const el = {
      data: () => data
    }

    function mockParentBoundary (top, right, bottom, left) {
      editor.parent = {
        getBoundingClientRect: jest.fn(() => ({
          top, right, bottom, left
        }))
      }
    }

    function mockMouse (clientX, clientY) {
      jest
        .spyOn(editor, 'getDomEvent')
        .mockReturnValue({ clientX, clientY })
    }

    beforeEach(() => {
      jest
        .spyOn(editor.deserializer, 'createElement')
        .mockImplementation(jest.fn())

      jest
        .spyOn(editor.deserializer, 'executeAllCommands')
        .mockImplementation(jest.fn())
    })

    describe('when the dragged element is outside the canvas bounds', () => {
      it('should not add the element if the mouse X is left of the canvas', () => {
        mockParentBoundary(20, 20, 20, 20)
        mockMouse(0, 0)
        editor.onDrop(el)

        expect(editor.deserializer.createElement).not.toHaveBeenCalled()
      })

      it('should not add the element if the mouse X is right of the canvas', () => {
        mockParentBoundary(20, 20, 20, 20)
        mockMouse(40, 0)
        editor.onDrop(el)

        expect(editor.deserializer.createElement).not.toHaveBeenCalled()
      })

      it('should not add the element if the mouse Y is above of the canvas', () => {
        mockParentBoundary(20, 20, 20, 20)
        mockMouse(20, 0)
        editor.onDrop(el)

        expect(editor.deserializer.createElement).not.toHaveBeenCalled()
      })

      it('should not add the element if the mouse Y is below of the canvas', () => {
        mockParentBoundary(20, 20, 20, 20)
        mockMouse(20, 50)
        editor.onDrop(el)

        expect(editor.deserializer.createElement).not.toHaveBeenCalled()
      })
    })

    describe('when the dragged element is within the canvas bounds', () => {
      const x = 20
      const y = 30

      beforeEach(() => {
        jest
          .spyOn(editor, 'getDraggedCoordinates')
          .mockReturnValue({ x, y })

        mockParentBoundary(20, 20, 20, 20)
        mockMouse(20, 20)

        editor.onDrop(el)
      })

      it('should call `createElement()` with the params and the translated document coordinates', () => {
        expect(editor.deserializer.createElement).toHaveBeenCalledTimes(1)
        expect(editor.deserializer.createElement).toHaveBeenCalledWith({
          id: expect.any(String),
          name: '',
          properties: properties,
          x,
          y
        })
      })

      it('should execute the queued CommandAdd command', () => {
        expect(editor.deserializer.executeAllCommands).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('getDraggedCoordinates()', () => {
    it('should return the canvas offset coordinates of the dragged element', () => {
      const element = document.createElement('div')
      const x = 30
      const y = 40

      element.className = 'ui-draggable-dragging'
      document.body.appendChild(element)

      jest
        .spyOn(Editor.prototype as draw2d.Canvas, 'fromDocumentToCanvasCoordinate')
        .mockReturnValue({ x, y })

      const coords = editor.getDraggedCoordinates()

      expect(coords).toHaveProperty('x')
      expect(coords).toHaveProperty('y')
      expect(coords.x).toEqual(x)
      expect(coords.y).toEqual(y)
    })
  })

  it('should initialize the debugMode and oscilloscopeEnabled flags to false', () => {
    expect(editor.debugMode).toEqual(false)
    expect(editor.oscilloscopeEnabled).toEqual(false)
  })

  describe('toggleDebug()', () => {
    beforeEach(() => {
      jest.spyOn(editor.oscillation, 'start')
      jest.spyOn(editor.oscillation, 'stop')
    })

    it('should stop the oscillation when in debug mode', () => {
      editor.debugMode = false
      editor.toggleDebug(true)

      expect(editor.oscillation.stop).toHaveBeenCalledTimes(1)
    })

    it('should start the oscillation when in not debug mode', () => {
      editor.debugMode = true
      editor.toggleDebug(false)

      expect(editor.oscillation.start).toHaveBeenCalledTimes(1)
    })

    it('should neither start nor stop the oscillation when the debugging flag has not changed', () => {
      editor.debugMode = false
      editor.toggleDebug(false)

      expect(editor.oscillation.start).not.toHaveBeenCalled()
      expect(editor.oscillation.stop).not.toHaveBeenCalled()
    })

    it('should update the debugMode flag', () => {
      editor.debugMode = false
      editor.toggleDebug(true)

      expect(editor.debugMode).toEqual(true)
    })
  })

  describe('fromCanvasToDocumentCoordinate()', () => {
    it('should return document coordinates with the absolute parent position subtracted', () => {
      const x = 20
      const y = 30
      const xOffset = 4
      const yOffset = 13

      jest
        .spyOn(Editor.prototype as draw2d.Canvas, 'fromCanvasToDocumentCoordinate')
        .mockReturnValue({ x, y })
        jest
          .spyOn(editor, 'getAbsoluteX')
          .mockReturnValue(xOffset)
        jest
          .spyOn(editor, 'getAbsoluteY')
          .mockReturnValue(yOffset)

      expect(editor.fromCanvasToDocumentCoordinate(12, 24)).toEqual({
        x: x - xOffset,
        y: y - yOffset
      })
    })
  })

  describe.skip('addNode()', () => {
    const node = new Element('12345', {})
    const x = 40
    const y = 60
    let addSpy, nodeSpy, stepSpy

    beforeEach(() => {
      addSpy = jest
        .spyOn(Editor.prototype as draw2d.Canvas, 'add')
        .mockImplementation(jest.fn())

      nodeSpy = jest
        .spyOn(editor.circuit, 'addNode')
        .mockImplementation(jest.fn())

      stepSpy = jest
        .spyOn(editor, 'step')
        .mockImplementation(jest.fn())

      editor.addNode(node, x, y)
    })

    it('should add a node to the canvas', () => {
      expect(addSpy).toHaveBeenCalledTimes(1)
      expect(addSpy).toHaveBeenCalledWith(node, x, y)
    })

    it('should add the node to the circuit instance', () => {
      expect(nodeSpy).toHaveBeenCalledTimes(1)
      expect(nodeSpy).toHaveBeenCalledWith(node.node)
    })

    it('should step the circuit', () => {
      expect(stepSpy).toHaveBeenCalledTimes(1)
      expect(stepSpy).toHaveBeenCalledWith(true)
    })
  })

  describe('step()', () => {
    beforeEach(() => {
      jest.spyOn(editor, 'step')
      jest.spyOn(editor.circuit, 'next')
    })

    describe('in debug mode', () => {
      beforeEach(() => {
        editor.debugMode = true
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
        editor.debugMode = false
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

  // describe('setMouseMode()', () => {
  //   let spy

  //   beforeEach(() => {
  //     spy = jest.spyOn(Editor.prototype as draw2d.Canvas, 'installEditPolicy')
  //   })

  //   it('should install the panning selection policy when in `PANNING` mode', () => {
  //     editor.setMouseMode('PANNING')

  //     expect(spy).toHaveBeenCalledWith(expect.any(draw2d.policy.editor.PanningSelectionPolicy))
  //   })

  //   it('should install the bounding box selection policy when in `SELECTION` mode', () => {
  //     editor.setMouseMode('SELECTION')

  //     expect(spy).toHaveBeenCalledWith(expect.any(draw2d.policy.editor.BoundingboxSelectionPolicy))
  //   })
  // })

  describe('policy installation', () => {
    let spy

    beforeEach(() => {
      spy = jest.spyOn(Editor.prototype as draw2d.Canvas, 'installEditPolicy')

      editor.installEditPolicies()
    })

    it('should install the drag-connection-edit policy', () => {
      expect(spy).toHaveBeenCalledWith(expect.any(draw2d.policy.connection.DragConnectionCreatePolicy))
    })
  })

  // describe('getEditorModel()', () => {
  //   xit('should return a new instance of EditorModel', () => {
  //     expect(editor.getEditorModel()).toBeInstanceOf(EditorModel)
  //   })
  // })

  describe('command stack functions', () => {
    let commandStack

    beforeEach(() => {
      commandStack = {
        undo: jest.fn(),
        redo: jest.fn(),
        undostack: [],
        redostack: []
      }

      jest
        .spyOn(Editor.prototype as draw2d.Canvas, 'getCommandStack')
        .mockReturnValue(commandStack)
    })

    describe('undo()', () => {
      it('should undo the last command', () => {
        jest.spyOn(commandStack, 'undo')

        editor.undo()

        expect(commandStack.undo).toHaveBeenCalledTimes(1)
      })

      describe('when undoing fails', () => {
        beforeEach(() => {
          jest
            .spyOn(commandStack, 'undo')
            .mockImplementation(() => {
              throw new Error('Failed to undo')
            })

          editor.undo()
        })

        it('should reverse the undo (i.e., redo) of the last command', () => {
          expect(commandStack.redo).toHaveBeenCalledTimes(1)
        })

        it('should clear the corrupted undo stack', () => {
          expect(commandStack.redostack).toHaveLength(0)
        })
      })
    })

    describe('redo()', () => {
      it('should undo the last command', () => {
        jest.spyOn(commandStack, 'redo')

        editor.redo()

        expect(commandStack.redo).toHaveBeenCalledTimes(1)
      })

      describe('when redoing fails', () => {
        beforeEach(() => {
          jest
            .spyOn(commandStack, 'redo')
            .mockImplementation(() => {
              throw new Error('Failed to redo')
            })

          editor.redo()
        })

        it('should reverse the redo (i.e., undo) of the last command', () => {
          expect(commandStack.undo).toHaveBeenCalledTimes(1)
        })

        it('should clear the corrupted redo stack', () => {
          expect(commandStack.redostack).toHaveLength(0)
        })
      })
    })
  })
})
