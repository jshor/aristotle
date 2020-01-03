import DigitSVG from '../DigitSVG'

const WIRE_LENGTH = 40

describe('Digit SVG renderer', () => {
  let renderer

  beforeEach(() => {
    renderer = new DigitSVG({
      chars: 'abc'
    })
  })

  describe('getNumber()', () => {
    it('should render the correct colors for the char \'7\'', () => {
      expect(renderer.getNumber('7')).toMatchSnapshot()
    })
  })

  describe('getInputLine()', () => {
    let line
    const y = 30

    beforeEach(() => {
      line = renderer.getInputLine(y)
    })

    it('should return an SVG <line /> element', () => {
      expect(line).toMatch(/^<line([^>]+)>$/)
    })

    it('should set the x values to 0 and WIRE_LENGTH, respectively', () => {
      expect(line).toContain(`x1="${0}"`)
      expect(line).toContain(`x2="${WIRE_LENGTH}"`)
    })

    it('should set the y values to the one specified', () => {
      expect(line).toContain(`y1="${y}"`)
      expect(line).toContain(`y2="${y}"`)
    })
  })

  describe('setChars()', () => {
    it('should set the `chars` on the renderer instance', () => {
      const chars = 'f123'

      renderer.setChars(chars)
      expect(renderer.chars).toEqual(chars)
    })
  })

  describe('getPortDefinitions()', () => {
    let ports

    beforeEach(() => {
      ports = renderer.getPortDefinitions()
    })

    it('should return 4 ports', () => {
      expect(Array.isArray(ports)).toBe(true)
      expect(ports).toHaveLength(4)
    })

    it('should define `input` and its cartesian values for each port', () => {
      const assertions = 5

      expect.assertions(ports.length * assertions)
      ports.forEach((port) => {
        expect(port).toHaveProperty('type')
        expect(port.type).toEqual('input')
        expect(port).toHaveProperty('x')
        expect(port.x).toEqual(0)
        expect(port).toHaveProperty('y')
      })
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
