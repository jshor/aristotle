const PORT_WIDTH = 30
const STROKE_WIDTH = 2
const WIRE_LENGTH = 40

const PATH = {
  OR: 'm 0.13229001,0.13246053 v 0.0165 C 0.71404001,1.1583605 1.05006,2.3240605 1.05006,3.5719605 c 0,1.248 -0.33601999,2.4136 -0.91776999,3.423 v 0.0165 H 3.69589 c 2.5428,0 4.7625,-1.3862 5.9531,-3.4396 -1.1906,-2.0534 -3.4103,-3.43959997 -5.9531,-3.43959997 h -2.6458 z',
  NOR: 'm 9.6570348,3.5685025 c 0,0.2921 -0.237067,0.5291667 -0.529167,0.5291667 -0.2921,0 -0.5291667,-0.2370667 -0.5291667,-0.5291667 0,-0.2921001 0.2370667,-0.5291667 0.5291667,-0.5291667 0.2921,0 0.529167,0.2370666 0.529167,0.5291667 z M 0.12510134,0.12472492 v 0.0165371 C 0.64193176,1.1529323 0.94045405,2.3212541 0.94045405,3.5719608 c 0,1.2508069 -0.29852229,2.4190284 -0.81535271,3.4306986 v 0.016537 H 3.2910264 c 2.2590398,0 4.2310355,-1.3893178 5.2887721,-3.4473361 C 7.5220619,1.5138422 5.5500662,0.12452447 3.2910264,0.12452447 H 0.94048068 Z',
  AND: 'm5.1594 7.0114-5.0271 1e-6v-6.8788l5.0271-3.704e-4c1.8987 0 3.4396 1.5409 3.4396 3.4396 0 1.8987-1.5409 3.4396-3.4396 3.4396z',
  NAND: 'm 9.6770082,3.5685025 c 0,0.2921 -0.237067,0.5291667 -0.529167,0.5291667 -0.2921,0 -0.5291667,-0.2370667 -0.5291667,-0.5291667 0,-0.2921 0.2370667,-0.5291667 0.5291667,-0.5291667 0.2921,0 0.529167,0.2370667 0.529167,0.5291667 z m -4.5176325,3.4429409 -5.02708403,1e-6 V 0.1326548 L 5.1593757,0.1322844 c 1.8986501,0 3.4395832,1.5409332 3.4395832,3.4395833 0,1.8986507 -1.5409331,3.4395837 -3.4395832,3.4395837 z',
  XOR_BASE: 'm0.17336 0.089543c0.54262 1.0146 0.85604 2.186 0.85604 3.4404 0 1.2543-0.31343 2.4258-0.85604 3.4404'
}

const NEGATION_X = {
  NOR: 84,
  XNOR: 84,
  NAND: 78
}

const baseLineAttrs = {
  'stroke': '#000',
  'stroke-linecap': 'square',
  'stroke-width': 2,
  'vector-effect': 'non-scaling-stroke'
}

function toSvg (tag: string, attrs: Object, children: string[] = []) {
  const attributes: string[] = [tag]

  for (const key in attrs) {
    attributes.push(`${key}="${attrs[key]}"`)
  }

  if (children.length) {
    return `<${attributes.join(' ')}>${children.join('')}</${tag}>`
  }
  return `<${ attributes.join(' ')} />`
}


function getWires (wireCount, x, svgHeight) {
  const inputHeight = (wireCount - 1) * PORT_WIDTH
  const yOffset = svgHeight / 2 - inputHeight / 2
  const wires = []

  for (let i = 0; i < wireCount; i++) {
    wires.push(toSvg('line', {
      x1: x,
      x2: x + WIRE_LENGTH,
      y1: yOffset + i * PORT_WIDTH,
      y2: yOffset + i * PORT_WIDTH,
      ...baseLineAttrs
    }))
  }

  return wires
}

function getFigureSvg (x, pathData, fill = '#fff') {
  const path = toSvg('path', {
    d: pathData,
    fill,
    ...baseLineAttrs
  })

  return toSvg('svg', {
    height: '100%',
    viewBox: '0 0 16 7.25',
    preserveAspectRatio: 'none',
    x
  }, [path])
}

function getPathData (gateType) {
  if (~['XNOR', 'XOR', 'OR'].indexOf(gateType)) {
    return PATH.OR
  }
  switch (gateType) {
    case 'AND':
    case 'NAND':
      return PATH.AND
    case 'OR':
    case 'XOR':
    case 'XNOR':
      return PATH.OR
    default:
      return PATH.OR
  }
}

function isNegated (gateType) {
  return ['XNOR', 'NOR', 'NAND'].indexOf(gateType) !== -1
}

function getNegation (gateType, height) {
  const x = NEGATION_X[gateType]
  const r = 4

  if (x) {
    return toSvg('circle', {
      cx: x,
      cy: height / 2,
      r,
      fill: '#fff',
      ...baseLineAttrs
    })
  }
  return ''
}

function toDataUrl (svg) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

function render (gateType, inputCount, color, bgColor) {
  const height = inputCount > 2
    ? inputCount * PORT_WIDTH + inputCount * STROKE_WIDTH
    : 50
  const width = 100
  const pathData = getPathData(gateType)
  const children = [
    ...getWires(inputCount, 0, height),
    ...getWires(1, width - WIRE_LENGTH, height),
    getFigureSvg(20, pathData)
  ]

  if (gateType === 'XOR' || gateType === 'XNOR') {
    children.push(getFigureSvg(10, PATH.XOR_BASE, 'none'))
  }

  children.push(getNegation(gateType, height))

  const svg = toSvg('svg', {
    width,
    height,
    xmlns: 'http://www.w3.org/2000/svg'
  }, children)

  const path = toDataUrl(svg)

  const ports = [
    { x: 0, y: 10, type: 'input' },
    { x: 0, y: 40, type: 'input' },
    { x: width, y: height / 2, type: 'output' }
  ]

  return {
    path,
    width,
    height,
    ports
  }
}

export default render
