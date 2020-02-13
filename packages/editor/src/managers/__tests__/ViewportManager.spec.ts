import draw2d from 'draw2d'
import ViewportManager from '../ViewportManager'
import Editor from '../../core/Editor'
import Switch from '../../elements/Switch'

jest.mock('../../core/Editor')

describe('Viewport Manager', () => {
  let manager
  let editor

  beforeEach(() => {
    editor = new Editor('testEditor')
    manager = new ViewportManager(editor)
  })

  afterEach(() => {
    jest.resetAllMocks()
    document.body.innerHTML = ''
  })

  describe('getZoomPercentage()', () => {
    it('should return the current zoom level as a percentage (0,100]', () => {
      jest
        .spyOn(editor, 'getZoom')
        .mockReturnValue(1.5)

      expect(manager.getZoomPercentage()).toEqual(67)
    })
  })

  describe('centerAllFigures()', () => {
    it('should move all figures to the center of the canvas', () => {
      jest
        .spyOn(editor, 'getWidth')
        .mockReturnValue(1820)
      jest
        .spyOn(editor, 'getHeight')
        .mockReturnValue(1080)

      const elementA: draw2d.Figure = new Switch('testA', {})
      const elementB: draw2d.Figure = new Switch('testB', {})
      const list = new draw2d.util.ArrayList()

      list.add(elementA)
      list.add(elementB)

      jest
        .spyOn(editor, 'getFigures')
        .mockReturnValue(list)

      elementA.setX(30)
      elementA.setY(40)
      elementB.setX(100)
      elementB.setY(120)

      manager.centerAllFigures()

      expect(elementA.x).toEqual(827)
      expect(elementA.y).toEqual(463)
      expect(elementB.x).toEqual(897)
      expect(elementB.y).toEqual(543)
    })
  })

  describe('panToCenter()', () => {
    it('should scroll the viewport to the center of the canvas', () => {
      editor.parent = document.createElement('div')
      editor.parent.scrollTo = jest.fn()

      document.body.appendChild(editor.parent)

      const spy = jest.spyOn(editor.parent, 'scrollTo')

      jest
        .spyOn(editor, 'getWidth')
        .mockReturnValue(1440)
      jest
        .spyOn(editor, 'getHeight')
        .mockReturnValue(1080)
      jest
        .spyOn(editor.parent, 'getBoundingClientRect')
        .mockReturnValue({
          width: 520,
          height: 600
        })

      manager.panToCenter()

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(460, 240)
    })
  })

  describe('scaleViewboxByZoom()', () => {
    it('should return the viewbox screen coordinates scaled by the current zoom level', () => {
      const viewBox = {
        left: 300,
        top: 440,
        bottom: 610,
        right: 730,
        width: 430,
        height: 170
      }
      const scroll = {
        left: 230,
        top: 10
      }

      const coords = manager.scaleViewboxByZoom(viewBox, scroll, 1, 2)

      expect(coords.left).toEqual(7.5)
      expect(coords.top).toEqual(-37.5)
    })

    it('should fall back to 0 scroll positions if the viewBox area is larger than the canvas', () => {
      manager.canvas.width = 100
      manager.canvas.height = 100

      const viewBox = {
        left: 300,
        top: 440,
        bottom: 610,
        right: 730,
        width: 1500,
        height: 170
      }
      const scroll = {
        left: 230,
        top: 10
      }

      const coords = manager.scaleViewboxByZoom(viewBox, scroll, 1, 2)

      expect(coords.left).toEqual(0)
      expect(coords.top).toEqual(0)
    })
  })

  describe('setZoomLevel()', () => {
    const left = 60
    const top = 105

    beforeEach(() => {
      editor.parent = document.createElement('div')
      editor.parent.scrollTo = jest.fn()

      document.body.appendChild(editor.parent)

      jest
        .spyOn(editor, 'getScrollLeft')
        .mockReturnValue(40)
      jest
        .spyOn(editor, 'getScrollTop')
        .mockReturnValue(75)
      jest
        .spyOn(manager, 'scaleViewboxByZoom')
        .mockReturnValue({ left, top })
    })

    it('should scroll the HTML element to the computed screen coordinates', () => {
      const spy = jest.spyOn(editor.parent, 'scrollTo')

      manager.setZoomLevel(1.5)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(left, top)
    })

    it('should set the zoom factor', () => {
      const spy = jest.spyOn(editor, 'setZoom')
      const newZoomFactor = 1.5

      manager.setZoomLevel(newZoomFactor)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(newZoomFactor)
    })
  })
})
