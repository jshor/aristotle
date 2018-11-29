const WIRE_LENGTH = 30
const PORT_WIDTH = 30
const MIN_DIMENSION = 100
const STROKE_WIDTH = 2
const LABEL_HEIGHT = 8
const LABEL_PADDING = 6
const TEXT_SIZE = 12
const MIN_WIDTH = 150
const MIN_HEIGHT = 120

function toSvg (tag, attrs, children = []) {
  const attributes = [tag]
  
  for (const key in attrs) {
    attributes.push(`${key}="${attrs[key]}"`)
  }
  
  if (children.length) {
    return `<${attributes.join(' ')}>${children.join('')}</${tag}>`
  }
  return `<${ attributes.join(' ')} />`
}

function getHorizontalWire (x, y) {
  return toSvg('line', {
    x1: x,
    x2: x + WIRE_LENGTH,
    y1: y,
    y2: y,
    'stroke-width': STROKE_WIDTH,
    stroke: '#000'
  })
}

function getVerticalWire (x, y) {
  return toSvg('line', {
    x1: x,
    x2: x,
    y1: y,
    y2: y + WIRE_LENGTH,
    'stroke-width': STROKE_WIDTH,
    stroke: '#000'
  })
}

function getLabelData (label) {
  let text = label.toUpperCase()
  
  if (text.length > 3) {
    text = `${text.substring(0, 2)}…`
  }
  
  const width = text.length * 7.25
  
  return { text, width }
}

function getLabel (x, y, text) {
  const attrs = {
    'font-family': 'Lucida Console, Monaco, monospace',
    'font-size': TEXT_SIZE
  }
  return toSvg('text', { x, y, ...attrs }, [text])
}

function getTopLabel (label, x, y) {
  const { text, width } = getLabelData(label)
  
  return getLabel(x - width / 2, y + LABEL_PADDING, text)
}

function getLeftLabel (label, x, y) {
  const { text, width } = getLabelData(label)
  
  return getLabel(x + LABEL_PADDING, y, text)
}

function getRightLabel (label, x, y) {
  const { text, width } = getLabelData(label)
  
  return getLabel(x - width - LABEL_PADDING, y, text)
}

function getBottomLabel (label, x, y) {
  const { text, width } = getLabelData(label)
  
  return getLabel(x - width / 2, y - WIRE_LENGTH - LABEL_HEIGHT - LABEL_PADDING, text)
}

function getPortOffset (dimension, wireLength) {
  return dimension / 2 - (wireLength * PORT_WIDTH) / 2 + PORT_WIDTH / 2
}

function getLeftWires (wires, svgHeight, x) {
  const children = []
  const y = getPortOffset(svgHeight, wires.length)
  
  return wires
    .map(({ label }, i) => {
      return getHorizontalWire(x, y + i * PORT_WIDTH)
        + getLeftLabel(label, x + PORT_WIDTH, y + i * PORT_WIDTH + LABEL_HEIGHT / 2)
    })
}

function getRightWires (wires, svgHeight, x) {
  const children = []
  const y = getPortOffset(svgHeight, wires.length)
  
  return wires
    .map(({ label }, i) => {
      return getHorizontalWire(x, y + i * PORT_WIDTH)
        + getRightLabel(label, x,  y + i * PORT_WIDTH + LABEL_HEIGHT / 2)
    })
}

function getTopWires (wires, svgWidth, y) {
  const children = []
  const x = getPortOffset(svgWidth, wires.length)
  
  return wires
    .map(({ label }, i) => {
      return getVerticalWire(x + i * PORT_WIDTH, y)
        + getTopLabel(label, x + i * PORT_WIDTH,  y + PORT_WIDTH + LABEL_HEIGHT)
    })
}

function getBottomWires (wires, svgWidth, y) {
  const children = []
  const x = getPortOffset(svgWidth, wires.length)
  
  return wires
    .map(({ label }, i) => {
      return getVerticalWire(x + i * PORT_WIDTH, y)
        + getBottomLabel(label, x + i * PORT_WIDTH, y + PORT_WIDTH + LABEL_HEIGHT)
    })
}

function getWireGroups (wires, { width, height }) {
  return [
    ...getLeftWires(wires.left, height, 0),
    ...getRightWires(wires.right, height, width - WIRE_LENGTH),
    ...getTopWires(wires.top, width, 0),
    ...getBottomWires(wires.bottom, width, height - WIRE_LENGTH)
  ]
}

function getBoundary (width, height) {
  return toSvg('rect', {
    x: WIRE_LENGTH,
    y: WIRE_LENGTH,
    width: width - WIRE_LENGTH * 2,
    height: height - WIRE_LENGTH * 2,
    stroke: '#000',
    'stroke-width': 2,
    fill: '#fff'
  })
}

function getSvgDimensions (wires) {
  const baseDim = PORT_WIDTH / 2 + PORT_WIDTH
  const getMaxDim = (a, b) => Math.max(wires[a].length, wires[b].length)
  const horzCount = getMaxDim('top', 'bottom') + 2
  const vertCount = getMaxDim('left', 'right')
  const baseWidth = horzCount * PORT_WIDTH + horzCount * STROKE_WIDTH + baseDim
  const baseHeight = vertCount * PORT_WIDTH + vertCount * STROKE_WIDTH + baseDim
  const width = Math.max(baseWidth, MIN_WIDTH)
  const height = Math.max(baseHeight, MIN_HEIGHT)
  
  return { width, height }
}

function render (wires) {
  const { width, height } = getSvgDimensions(wires)
  const wireGroups = getWireGroups(wires, { width, height })
  const boundary = getBoundary(width, height)
  const svg = toSvg('svg', { width, height }, [boundary, wireGroups])
  
  return btoa(svg)
}

export default render({
  top: [
    { label: 'ABC' },
    { label: 'B' },
    { label: 'CEEEE' },
    { label: 'DEF' }
  ],
  left: [
    { label: 'ABC' },
    { label: 'EDB' }
  ],
  bottom: [
    { label: 'Q' },
    { label: 'sfdfsd' }
  ],
  right: [
    { label: 'EWAA' },
    { label: 'BDE' },
    { label: 'SS' },
    { label: 'RRR' }
  ]
})