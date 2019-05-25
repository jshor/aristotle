import LogicGateSVG from '../LogicGateSVG'

describe('Logic Gate SVG library', () => {
  let renderer

  beforeEach(() => {
    renderer = new LogicGateSVG({
      inputCount: 2,
      gateType: 'NOR'
    })
  })

  describe('getWires()', () => {
    it('should return n line elements', () => {
      const x = 10
      const height = 50
      const wireCount = 3
      const lines = renderer.getWires(wireCount, x, height)

      expect(lines).toHaveLength(wireCount)
      lines.forEach((line) => expect(line).toMatch(/^<line([^>]+)>$/))
    })
  })

  describe('isNegated()', () => {
    it('should return true for NOR', () => {
      renderer.gateType = 'NOR'
      expect(renderer.isNegated()).toEqual(true)
    })

    it('should return true for NAND', () => {
      renderer.gateType = 'NAND'
      expect(renderer.isNegated()).toEqual(true)
    })

    it('should return true for XNOR', () => {
      renderer.gateType = 'XNOR'
      expect(renderer.isNegated()).toEqual(true)
    })

    it('should return false for OR', () => {
      renderer.gateType = 'OR'
      expect(renderer.isNegated()).toEqual(false)
    })
  })

  describe('setInputCount()', () => {
    it('should set `inputCount` to the given value', () => {
      const inputCount = 3

      renderer.inputCount = 2
      renderer.setInputCount(inputCount)

      expect(renderer.inputCount).toEqual(inputCount)
    })
  })

  describe('render()', () => {
    it('should return an array of port definitions', () => {
      const data = renderer.getSvgData()
      expect(data).toHaveProperty('ports')
      expect(Array.isArray(data.ports)).toEqual(true)
    })

    describe('path creation', () => {
      beforeEach(() => {
        jest
          .spyOn(renderer, 'toDataUrl')
          .mockImplementation(s => s)
      })

      function getSvg (gateType) {
        renderer.gateType = gateType
        return renderer.getSvgData().path
      }

      it('should render an OR gate', () => {
        expect(getSvg('OR')).toMatchSnapshot()
      })

      it('should render an NOR gate', () => {
        expect(getSvg('NOR')).toMatchSnapshot()
      })

      it('should render an XOR gate', () => {
        expect(getSvg('XOR')).toMatchSnapshot()
      })

      it('should render an XNOR gate', () => {
        expect(getSvg('XNOR')).toMatchSnapshot()
      })

      it('should render an AND gate', () => {
        expect(getSvg('AND')).toMatchSnapshot()
      })

      it('should render an NAND gate', () => {
        expect(getSvg('NAND')).toMatchSnapshot()
      })
    })
  })
})
