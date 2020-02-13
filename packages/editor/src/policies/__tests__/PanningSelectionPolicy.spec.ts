import draw2d from 'draw2d'
import PanningSelectionPolicy from '../PanningSelectionPolicy'
import Editor from '../../core/Editor'
import Element from '../../core/Element'

jest.mock('../../core/Editor')

describe('Panning Selection Policy', () => {
  let policy
  let canvas

  beforeEach(() => {
    canvas = new Editor('test')
    policy = new PanningSelectionPolicy()
  })

  afterEach(() => {
    jest.resetAllMocks()
    document.body.innerHTML = ''
  })

  describe('onMouseDrag()', () => {
    let element

    beforeEach(() => {
      element = {
        scrollTop: jest.fn(),
        scrollLeft: jest.fn()
      }
      canvas.zoomFactor = 1

      jest
        .spyOn(canvas, 'getScrollArea')
        .mockReturnValue(element)
    })

    describe('when the mouse is not interacting with any canvas elements', () => {
      it('should call its prototype method with the given arguments', () => {
        const spy = jest
          .spyOn(draw2d.policy.canvas.SingleSelectionPolicy.prototype, 'onMouseDrag')
          .mockImplementation(jest.fn())

        policy.onMouseDrag(canvas, 20, 30, 40, 50, false, false)

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(canvas, 20, 30, 40, 50, false, false)
      })

      it('should scroll to the newly-computed left coordinate', () => {
        const spy = jest
          .spyOn(element, 'scrollLeft')
          .mockReturnValue(30)

        policy.onMouseDrag(canvas, 20, 30, 40, 50, false, false)

        expect(spy).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenCalledWith(-10)
      })

      it('should scroll to the newly-computed top coordinate', () => {
        const spy = jest
          .spyOn(element, 'scrollTop')
          .mockReturnValue(30)

        policy.onMouseDrag(canvas, 20, 30, 40, 50, false, false)

        expect(spy).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenCalledWith(-20)
      })
    })

    it('should not change the scroll if the mouse is dragging an element', () => {
      const spyLeft = jest.spyOn(element, 'scrollLeft')
      const spyTop = jest.spyOn(element, 'scrollTop')

      policy.mouseDraggingElement = new Element('testElement', {})

      policy.onMouseDrag(canvas, 20, 30, 40, 50, false, false)

      expect(spyLeft).not.toHaveBeenCalled()
      expect(spyTop).not.toHaveBeenCalled()
    })

    it('should not change the scroll if the mouse is down on an element', () => {
      const spyLeft = jest.spyOn(element, 'scrollLeft')
      const spyTop = jest.spyOn(element, 'scrollTop')

      policy.mouseDownElement = new Element('testElement', {})

      policy.onMouseDrag(canvas, 20, 30, 40, 50, false, false)

      expect(spyLeft).not.toHaveBeenCalled()
      expect(spyTop).not.toHaveBeenCalled()
    })
  })
})
