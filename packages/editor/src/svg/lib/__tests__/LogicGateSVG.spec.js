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

  describe('render()', () => {
    let data

    beforeEach(() => {
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
