import Element from '../Element'
import draw2d from 'draw2d'

const { Image } = draw2d.shape.basic

describe('Element base class', () => {
  let element: Element

  beforeEach(() => {
    element = new Element('testElement')
  })

  describe('render()', () => {
    const ports = [{ x: 1, y: 0, type: 'input' }]
    const width = 20
    const height = 50
    const path = '<svg></svg>'

    beforeEach(() => {
      jest.spyOn(Image.prototype, 'setPath')
      jest.spyOn(Image.prototype, 'setWidth')
      jest.spyOn(Image.prototype, 'setHeight')
      jest.spyOn(element, 'setPorts')
      jest.spyOn(element, 'getSvg').mockReturnValue({
        ports, width, height, path
      })
    })

    it('should set the width, height and path of the SVG', () => {
      element.render()

      expect(Image.prototype.setWidth).toHaveBeenCalledTimes(1)
      expect(Image.prototype.setWidth).toHaveBeenCalledWith(width)
      expect(Image.prototype.setHeight).toHaveBeenCalledTimes(1)
      expect(Image.prototype.setHeight).toHaveBeenCalledWith(height)
      expect(Image.prototype.setPath).toHaveBeenCalledTimes(1)
      expect(Image.prototype.setPath).toHaveBeenCalledWith(path)
    })

    it('should not render the ports', () => {
      element.render()

      expect(element.setPorts).not.toHaveBeenCalled()
    })

    it('should render the ports when the `renderPorts` flag is passed', () => {
      element.render(true)

      expect(element.setPorts).toHaveBeenCalledTimes(1)
      expect(element.setPorts).toHaveBeenCalledWith(ports)
    })
  })
})
