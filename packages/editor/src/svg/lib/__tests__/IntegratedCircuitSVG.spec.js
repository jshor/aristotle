import IntegratedCircuitSVG from '../IntegratedCircuitSVG'
import ports from './__fixtures__/ports.json'

const WIRE_LENGTH = 30

describe('Integrated Circuit SVG renderer', () => {
  const title = 'Test circuit'
  let renderer

  beforeEach(() => {
    renderer = new IntegratedCircuitSVG({
      title,
      ports
    })
  })

  describe('getHorizontalWire()', () => {
    const x = 10
    const y = 30
    let line

    beforeEach(() => {
      line = renderer.getHorizontalWire(x, y)
    })

    it('should return a line element', () => {
      expect(line).toMatch(/^<line([^>]+)>$/)
    })

    it('should set the x values to span the wire length', () => {
      expect(line).toContain(`x1="${x}`)
      expect(line).toContain(`x2="${x + WIRE_LENGTH}`)
    })

    it('should be set on the given y value', () => {
      expect(line).toContain(`y1="${y}`)
      expect(line).toContain(`y2="${y}`)
    })
  })

  describe('getVerticalWire()', () => {
    const x = 100
    const y = 50
    let line

    beforeEach(() => {
      line = renderer.getVerticalWire(x, y)
    })

    it('should return a line element', () => {
      expect(line).toMatch(/^<line([^>]+)>$/)
    })

    it('should be set on the given x value', () => {
      expect(line).toContain(`x1="${x}`)
      expect(line).toContain(`x2="${x}`)
    })

    it('should set the y values to span the wire length', () => {
      expect(line).toContain(`y1="${y}`)
      expect(line).toContain(`y2="${y + WIRE_LENGTH}`)
    })
  })

  describe('getLabelData()', () => {
    const text = 'foo'
    let data

    beforeEach(() => {
      data = renderer.getLabelData('foo')
    })

    it('should return the text in uppercase', () => {
      expect(data.text).toEqual(text.toUpperCase())
    })

    it('should return the width', () => {
      expect(data.width).toEqual(7.25 * text.length)
    })

    it('should truncate, uppercase, and append an ellipsis to text that is greater than 3 chars', () => {
      data = renderer.getLabelData('longtext')

      expect(data.text).toEqual('LO…')
    })
  })

  describe('getLabel()', () => {
    it('should render the label', () => {
      expect(renderer.getLabel(10, 20, 'foo')).toMatch(/^<text([^>]+)>foo<\/text>$/)
    })
  })

  describe('render()', () => {
    let data

    beforeEach(() => {
      jest
        .spyOn(renderer, 'toDataUrl')
        .mockImplementation(s => s)

      data = renderer.getSvgData()
    })

    it('should render the integrated circuit', () => {
      expect(data).toMatchSnapshot()
    })

    it('should return an array of port definitions', () => {
      expect(data).toHaveProperty('ports')
      expect(Array.isArray(data.ports)).toEqual(true)
    })
  })
})
