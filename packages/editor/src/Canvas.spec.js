import Draw2DCanvas from './Draw2DCanvas'
import { util } from 'draw2d'
import Canvas from './Canvas'
import $ from 'jquery'

jest.mock('./Draw2DCanvas', () => {
  class Canvas {
    html = [{ parentNode: null }]

    setScrollArea = jest.fn()

    fireEvent = jest.fn()

    addElement = jest.fn()

    fromDocumentToCanvasCoordinate () {
      return { x: 0, y: 0 }
    }

    calculateConnectionIntersection = jest.fn()

    on = jest.fn()

    commandStack = {
      addEventListener: jest.fn()
    }
  }

  return Canvas
})

// $.fn.draggable = jest.fn()
// $.fn.droppable = jest.fn()

jest.mock('./services/ElementInitializerService')

describe('Canvas', () => {
  let canvas

  beforeEach(() => {
    canvas = new Canvas()
  })

  afterEach(() => jest.resetAllMocks())

  describe('registerEventListeners()', () => {
    beforeEach(() => {
      jest.spyOn(document, 'addEventListener')
      canvas.commandStack = {
        addEventListener: jest.fn()
      }
      canvas.wrapper = {
        addEventListener: jest.fn()
      }
      canvas.registerEventListeners()
    })

    it('should attach the `mousemove` and  `mouseup` listeners', () => {
      expect(document.addEventListener).toHaveBeenCalledWith('mousemove', canvas.onBoundlessMouseMove)
      expect(document.addEventListener).toHaveBeenCalledWith('mouseup', canvas.onBoundlessMouseUp)
    })

    it('should fire `commandStackChanged` when the command stack changes', () => {
      jest.spyOn(canvas, 'fireEvent')
      jest
        .spyOn(canvas.commandStack, 'addEventListener')
        .mockImplementation((cb) => cb())

      canvas.registerEventListeners()

      expect(canvas.fireEvent).toHaveBeenCalledTimes(1)
      expect(canvas.fireEvent).toHaveBeenCalledWith('commandStackChanged')
    })
  })

  describe('onDeselect()', () => {
    let selection

    beforeEach(() => {
      jest.spyOn(canvas, 'fireEvent')

      selection = new util.ArrayList()
      canvas.getSelection = jest.fn(() => selection)
    })

    it('should fire `toolbox.close` when the selection is empty', () => {
      canvas.onDeselect()

      expect(canvas.fireEvent).toHaveBeenCalledTimes(1)
      expect(canvas.fireEvent).toHaveBeenCalledWith('toolbox.close')
    })

    it('should not fire `toolbox.close` when an item is present in the selection', () => {
      selection.add('foo')
      canvas.onDeselect()

      expect(canvas.fireEvent).not.toHaveBeenCalled()
    })
  })

  describe('positioning handlers', () => {
    beforeEach(() => {
      const parent = document.createElement('div')

      document.body.appendChild(parent)
      canvas.parent = parent
    })

    describe('getAbsoluteX()', () => {
      it('should return 0', () => {
        expect(canvas.getAbsoluteX()).toEqual(0)
      })
    })

    describe('getAbsoluteY()', () => {
      it('should return 0', () => {
        expect(canvas.getAbsoluteY()).toEqual(0)
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
    let policy1, policy2

    beforeEach(() => {
      policy1 = { onMouseDrag: jest.fn(), onMouseUp: jest.fn() }
      policy2 = { onMouseDrag: jest.fn(), onMouseUp: jest.fn() }

      canvas.editPolicy = new util.ArrayList()
      canvas.editPolicy.add(policy1)
      canvas.editPolicy.add(policy2)
    })

    describe('onBoundlessMouseMove()', () => {
      describe('when the mouse is down', () => {
        beforeEach(() => {
          canvas.mouseDown = true
        })

        it('should apply the computed canvas deltas on each mouse-down edit policy', () => {
          canvas.onBoundlessMouseMove(event)

          expect(policy1.onMouseDrag).toHaveBeenCalledTimes(1)
          expect(policy2.onMouseDrag).toHaveBeenCalledTimes(1)
        })

        it('should fire the `mousemove` event', () => {
          jest.spyOn(canvas, 'fireEvent')
          canvas.onBoundlessMouseMove(event)

          expect(canvas.fireEvent).toHaveBeenCalledTimes(1)
          expect(canvas.fireEvent).toHaveBeenCalledWith('mousemove', expect.any(Object))
        })
      })

      describe('when the mouse is not down', () => {
        beforeEach(() => {
          canvas.mouseDown = false
        })

        it('should not trigger any edit policies', () => {
          canvas.onBoundlessMouseMove(event)

          expect(policy1.onMouseDrag).not.toHaveBeenCalled()
          expect(policy2.onMouseDrag).not.toHaveBeenCalled()
        })

        it('should not fire any events', () => {
          jest.spyOn(canvas, 'fireEvent')
          canvas.onBoundlessMouseMove(event)

          expect(canvas.fireEvent).not.toHaveBeenCalled()
        })
      })
    })

    describe('onBoundlessMouseUp()', () => {
      describe('when the mouse is down', () => {
        beforeEach(() => {
          canvas.mouseDown = true
          canvas.onBoundlessMouseUp(event)
        })

        it('should apply the computed canvas deltas on each mouse-down edit policy', () => {
          expect(policy1.onMouseUp).toHaveBeenCalledTimes(1)
          expect(policy2.onMouseUp).toHaveBeenCalledTimes(1)
        })

        it('should recalculate the canvas intersection', () => {
          jest.spyOn(canvas, 'calculateConnectionIntersection')

          expect(canvas.calculateConnectionIntersection).toHaveBeenCalledTimes(1)
        })

        it('should reset the `mouseDown` flag back to false', () => {
          expect(canvas.mouseDown).toEqual(false)
        })

        it('should reset the mouse drag deltas', () => {
          expect(canvas.mouseDragDiffX).toEqual(0)
          expect(canvas.mouseDragDiffY).toEqual(0)
        })
      })

      describe('when the mouse is not down', () => {
        beforeEach(() => {
          canvas.mouseDown = false
          canvas.onBoundlessMouseUp(event)
        })

        it('should recalculate the canvas intersection', () => {
          jest.spyOn(canvas, 'calculateConnectionIntersection')

          expect(canvas.calculateConnectionIntersection).not.toHaveBeenCalled()
        })

        it('should not trigger any edit policies', () => {
          expect(policy1.onMouseUp).not.toHaveBeenCalled()
          expect(policy2.onMouseUp).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('onDrop()', () => {
    const data = { type: 'LogicGate' }
    const el = {
      data: () => data
    }

    function mockParentBoundary (top, right, bottom, left) {
      canvas.parent = {
        getBoundingClientRect: jest.fn(() => ({
          top, right, bottom, left
        }))
      }
    }

    function mockMouse (clientX, clientY) {
      jest
        .spyOn(canvas, 'getDomEvent')
        .mockReturnValue({ clientX, clientY })
    }

    beforeEach(() => {
      jest.spyOn(canvas, 'addElement')
    })

    describe('when the dragged element is outside the canvas bounds', () => {
      it('should not add the element if the mouse X is left of the canvas', () => {
        mockParentBoundary(20, 20, 20, 20)
        mockMouse(0, 0)
        canvas.onDrop(el)

        expect(canvas.addElement).not.toHaveBeenCalled()
      })

      it('should not add the element if the mouse X is right of the canvas', () => {
        mockParentBoundary(20, 20, 20, 20)
        mockMouse(40, 0)
        canvas.onDrop(el)

        expect(canvas.addElement).not.toHaveBeenCalled()
      })

      it('should not add the element if the mouse Y is above of the canvas', () => {
        mockParentBoundary(20, 20, 20, 20)
        mockMouse(20, 0)
        canvas.onDrop(el)

        expect(canvas.addElement).not.toHaveBeenCalled()
      })

      it('should not add the element if the mouse Y is below of the canvas', () => {
        mockParentBoundary(20, 20, 20, 20)
        mockMouse(20, 50)
        canvas.onDrop(el)

        expect(canvas.addElement).not.toHaveBeenCalled()
      })
    })

    describe('when the dragged element is within the canvas bounds', () => {
      it('should call `addElement()` with the params and the translated document coordinates', () => {
        const x = 20
        const y = 30

        jest
          .spyOn(canvas, 'getDraggedCoordinates')
          .mockReturnValue({ x, y })
        mockParentBoundary(20, 20, 20, 20)
        mockMouse(20, 20)
        canvas.onDrop(el)

        expect(canvas.addElement).toHaveBeenCalledTimes(1)
        expect(canvas.addElement).toHaveBeenCalledWith(data, x, y)
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
        .spyOn(canvas, 'fromDocumentToCanvasCoordinate')
        .mockReturnValue({ x, y })

      const coords = canvas.getDraggedCoordinates()

      expect(coords).toHaveProperty('x')
      expect(coords).toHaveProperty('y')
      expect(coords.x).toEqual(x)
      expect(coords.y).toEqual(y)
    })
  })
})
