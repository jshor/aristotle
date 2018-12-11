import renderIntegratedCircuit from '../ic'

describe('test', () => {
  const render = ({ left = [], right = [], top = [], bottom = [] },
    color = '#000', bgColor = '#fff') => {
    return renderIntegratedCircuit({ left, right, top, bottom }, color, bgColor)
  }

  it('should correctly render with only 1 left wire', () => {
    const { path, ports, width, height } = render({ right: [
      { label: '*', type: 'output' }
    ] })

    expect(path).toMatchSvg()
    expect(ports).toEqual([{ type: 'output', x: 150, y: 60 }])
    expect(width).toEqual(150)
    expect(height).toEqual(120)
  })

  it('should correctly render with only 1 right wire', () => {
    const { path, ports, width, height } = render({ left: [
      { label: '*', type: 'output' }
    ] })

    expect(path).toMatchSvg()
    expect(ports).toEqual([{ type: 'output', x: 0, y: 60 }])
    expect(width).toEqual(150)
    expect(height).toEqual(120)
  })

  it('should correctly render with only 1 top wire', () => {
    const { path, ports, width, height } = render({ top: [
      { label: '*', type: 'output' }
    ] })

    expect(path).toMatchSvg()
    expect(ports).toEqual([{ type: 'output', x: 75, y: 0 }])
    expect(width).toEqual(150)
    expect(height).toEqual(120)
  })
})
