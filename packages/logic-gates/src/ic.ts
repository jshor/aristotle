const WIRE_LENGTH = 30
const PORT_WIDTH = 30
const MIN_DIMENSION = 100
const STROKE_WIDTH = 2
const LABEL_HEIGHT = 8
const LABEL_PADDING = 6
const TEXT_SIZE = 12
const MIN_WIDTH = 150
const MIN_HEIGHT = 120
const STROKE_COLOR = '#000'

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
    stroke: STROKE_COLOR
  })
}

function getVerticalWire (x, y) {
  return toSvg('line', {
    x1: x,
    x2: x,
    y1: y,
    y2: y + WIRE_LENGTH,
    'stroke-width': STROKE_WIDTH,
    stroke: STROKE_COLOR
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
    .map(({ label, type }, i) => ({
      wire: getHorizontalWire(x, y + i * PORT_WIDTH),
      label: getLeftLabel(label, x + PORT_WIDTH, y + i * PORT_WIDTH + LABEL_HEIGHT / 2),
      port: {
        x,
        y: y + i * PORT_WIDTH,
        type
      }
    }))
}

function getRightWires (wires, svgHeight, x) {
  const children = []
  const y = getPortOffset(svgHeight, wires.length)

  return wires
    .map(({ label, type }, i) => ({
      wire: getHorizontalWire(x, y + i * PORT_WIDTH),
      label: getRightLabel(label, x,  y + i * PORT_WIDTH + LABEL_HEIGHT / 2),
      port: {
        x: x + WIRE_LENGTH,
        y: y + i * PORT_WIDTH,
        type
      }
    }))
}

function getTopWires (wires, svgWidth, y) {
  const children = []
  const x = getPortOffset(svgWidth, wires.length)

  return wires
    .map(({ label, type }, i) => ({
      wire: getVerticalWire(x + i * PORT_WIDTH, y),
      label: getTopLabel(label, x + i * PORT_WIDTH,  y + PORT_WIDTH + LABEL_HEIGHT),
      port: {
        x: x + i * PORT_WIDTH,
        y,
        type
      }
    }))
}

function getBottomWires (wires, svgWidth, y) {
  const children = []
  const x = getPortOffset(svgWidth, wires.length)

  return wires
    .map(({ label, type }, i) => ({
      wire: getVerticalWire(x + i * PORT_WIDTH, y),
      label: getBottomLabel(label, x + i * PORT_WIDTH, y + PORT_WIDTH + LABEL_HEIGHT),
      port: {
        x: x + i * PORT_WIDTH,
        y: y + WIRE_LENGTH,
        type
      }
    }))
}

function getWireGroups (wires, { width, height }) {
  const left = getLeftWires(wires.left, height, 0)
  const right = getRightWires(wires.right, height, width - WIRE_LENGTH)
  const top = getTopWires(wires.top, width, 0)
  const bottom = getBottomWires(wires.bottom, width, height - WIRE_LENGTH)
  const get = (group, key) => group.map(e => e[key])

  return {
    wires: [
      ...get(left, 'wire'),
      ...get(right, 'wire'),
      ...get(top, 'wire'),
      ...get(bottom, 'wire')
    ],
    labels: [
      ...get(left, 'label'),
      ...get(right, 'label'),
      ...get(top, 'label'),
      ...get(bottom, 'label')
    ],
    ports: [
      ...get(left, 'port'),
      ...get(right, 'port'),
      ...get(top, 'port'),
      ...get(bottom, 'port')
    ]
  }
}

function getBoundary (wires, width, height, color, bgColor = '#fff') {
  // const wireHorzCount = wires.left.length ? (wires.right.length ? 2 : 1) : 0
  // const wireVertCount = wires.top.length ? (wires.bottom.length ? 2 : 1) : 0

  return toSvg('rect', {
    x: WIRE_LENGTH,
    y: WIRE_LENGTH,
    width: width - WIRE_LENGTH * 2,
    height: height - WIRE_LENGTH * 2,
    stroke: color,
    'stroke-width': STROKE_WIDTH,
    fill: bgColor
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

function toDataUrl (svg) {
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}

function render (data, color, bgColor) {
  const { width, height } = getSvgDimensions(data)
  const { wires, labels, ports } = getWireGroups(data, { width, height })
  const boundary = getBoundary(data, width, height, color, bgColor)
  const svg = toSvg('svg', {
    width,
    height,
    xmlns: 'http://www.w3.org/2000/svg'
  }, [
    boundary,
    ...wires,
    ...labels
  ])
  const path = svg // toDataUrl(svg)

  return {
    path,
    ports,
    width,
    height
  }
}

export default render
