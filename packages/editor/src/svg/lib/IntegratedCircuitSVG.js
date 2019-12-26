import SVGBase from './SVGBase'

const WIRE_LENGTH = 30
const PORT_WIDTH = 30
const MIN_DIMENSION = 300
const STROKE_WIDTH = 2
const LABEL_HEIGHT = 8
const LABEL_PADDING = 6
const TEXT_SIZE = 12
const MIN_WIDTH = 120
const MIN_HEIGHT = 120

/**
 * Creates an integrated circuit image based on configured port definitions and label.
 *
 * @note A *wire group* is a collection of lines, connectors (circles), and labels (text).
 */
export default class IntegratedCircuitSVG extends SVGBase {
  /**
   * Constructor.
   *
   * @param {Object} options
   * @param {String} options.title - title label of the IC
   * @param {Object[]} options.ports - port configurations
   */
  constructor (options) {
    super(options)

    this.title = options.title
    this.ports = options.ports

    this.outerDimensions = this.getOuterSvgDimensions()
    this.innerDimensions = this.getInnerSvgDimensions()
  }

  /**
   * Renders a horizontal wire (line).
   *
   * @param {Number} x - x-axis coordinate to start the line
   * @param {Number} x - y-axis coordinate to start the line
   * @returns {String} svg rendering of the horizontal line
   */
  getHorizontalWire = (x, y) => {
    return this.toSvg('line', {
      x1: x,
      x2: x + WIRE_LENGTH,
      y1: y,
      y2: y,
      'stroke-width': STROKE_WIDTH,
      stroke: this.primaryColor
    })
  }

  /**
   * Renders a vertical wire (line).
   *
   * @param {Number} x - x-axis coordinate to start the line
   * @param {Number} x - y-axis coordinate to start the line
   * @returns {String} svg rendering of the vertical line
   */
  getVerticalWire = (x, y) => {
    return this.toSvg('line', {
      x1: x,
      x2: x,
      y1: y,
      y2: y + WIRE_LENGTH,
      'stroke-width': STROKE_WIDTH,
      stroke: this.primaryColor
    })
  }

  /**
   * Returns the truncated text (if > 3 chars) and its estimated width.
   *
   * @param {String} label - the text to calculate
   * @returns {Object<{ text: String, width: Number }>}
   */
  getLabelData = (label) => {
    let text = label.toUpperCase()

    if (text.length > 3) {
      text = `${text.substring(0, 2)}…`
    }

    const width = text.length * 7.25

    return { text, width }
  }

  /**
   * Returns a text SVG element of the given label.
   *
   * @param {Number} x - x-axis coordinate to place the label
   * @param {Number} y - y-axis coordinate to place the label
   * @param {String} text - label content
   * @param {Object} [params] - optional params
   * @returns {String}
   */
  getLabel = (x, y, text, params) => {
    const attrs = {
      'font-family': 'Lucida Console, Monaco, monospace',
      'font-size': TEXT_SIZE,
      fill: this.primaryColor,
      ...params
    }
    return this.toSvg('text', { x, y, ...attrs }, [text])
  }

  /**
   * Renders a label for top wire ports.
   *
   * @param {String} label - label text
   * @param {Number} x - x-axis coordinate to place the label
   * @param {Number} y - y-axis coordinate to place the label
   * @returns {String}
   */
  getTopLabel = (label, x, y) => {
    const { text, width } = this.getLabelData(label)

    return this.getLabel(x - width / 2, y + LABEL_PADDING, text)
  }

  /**
   * Renders a label for left wire ports.
   *
   * @param {String} label - label text
   * @param {Number} x - x-axis coordinate to place the label
   * @param {Number} y - y-axis coordinate to place the label
   * @returns {String}
   */
  getLeftLabel = (label, x, y) => {
    const { text, width } = this.getLabelData(label)

    return this.getLabel(x + LABEL_PADDING, y, text)
  }

  /**
   * Renders a label for right wire ports.
   *
   * @param {String} label - label text
   * @param {Number} x - x-axis coordinate to place the label
   * @param {Number} y - y-axis coordinate to place the label
   * @returns {String}
   */
  getRightLabel = (label, x, y) => {
    const { text, width } = this.getLabelData(label)

    return this.getLabel(x - width - LABEL_PADDING, y, text)
  }

  /**
   * Renders a label for bottom wire ports.
   *
   * @param {String} label - label text
   * @param {Number} x - x-axis coordinate to place the label
   * @param {Number} y - y-axis coordinate to place the label
   * @returns {String}
   */
  getBottomLabel = (label, x, y) => {
    const { text, width } = this.getLabelData(label)

    return this.getLabel(x - width / 2, y - WIRE_LENGTH - LABEL_HEIGHT - LABEL_PADDING, text)
  }

  getPortOffset = (dimension, wireLength) => {
    return dimension / 2 - (wireLength * PORT_WIDTH) / 2 + PORT_WIDTH / 2
  }

  /**
   * Returns a list of rendered <line> elements for the left wires.
   *
   * @param {Object[]} wireGroup - the input data entry for the left wires
   * @param {Number} groupHeight - height of the wire group
   * @returns {String[]} list of <line> elements for the left wires
   */
  getLeftWires = (wireGroup, groupHeight, x) => {
    const y = this.getPortOffset(groupHeight, wireGroup.length)

    return wireGroup.map(({ label, type }, i) => ({
      wire: this.getHorizontalWire(x, y + i * PORT_WIDTH),
      label: this.getLeftLabel(label, x + PORT_WIDTH, y + i * PORT_WIDTH + LABEL_HEIGHT / 2),
      port: {
        x,
        y: y + i * PORT_WIDTH,
        type
      }
    }))
  }

  /**
   * Returns a list of rendered <line> elements for the right wires.
   *
   * @param {Object[]} wireGroup - the input data entry for the right wires
   * @param {Number} groupHeight - height of the wire group
   * @returns {String[]} list of <line> elements for the right wires
   */
  getRightWires = (wireGroup, groupHeight, x) => {
    const y = this.getPortOffset(groupHeight, wireGroup.length)

    return wireGroup.map(({ label, type }, i) => ({
      wire: this.getHorizontalWire(x, y + i * PORT_WIDTH),
      label: this.getRightLabel(label, x,  y + i * PORT_WIDTH + LABEL_HEIGHT / 2),
      port: {
        x: x + WIRE_LENGTH,
        y: y + i * PORT_WIDTH,
        type
      }
    }))
  }

  /**
   * Returns a list of rendered <line> elements for the top wires.
   *
   * @param {Object[]} wireGroup - the input data entry for the top wires
   * @param {Number} groupWidth - width of the wire group
   * @returns {String[]} list of <line> elements for the top wires
   */
  getTopWires = (wireGroup, groupWidth, y) => {
    const x = this.getPortOffset(groupWidth, wireGroup.length)

    return wireGroup.map(({ label, type }, i) => ({
      wire: this.getVerticalWire(x + i * PORT_WIDTH, y),
      label: this.getTopLabel(label, x + i * PORT_WIDTH,  y + PORT_WIDTH + LABEL_HEIGHT),
      port: {
        x: x + i * PORT_WIDTH,
        y,
        type
      }
    }))
  }

  /**
   * Returns a list of rendered <line> elements for the bottom wires.
   *
   * @param {Object[]} wireGroup - the input data entry for the bottom wires
   * @param {Number} groupWidth - width of the wire group
   * @returns {String[]} list of <line> elements for the bottom wires
   */
  getBottomWires = (wireGroup, groupWidth, y) => {
    const x = this.getPortOffset(groupWidth, wireGroup.length)

    return wireGroup.map(({ label, type }, i) => ({
      wire: this.getVerticalWire(x + i * PORT_WIDTH, y),
      label: this.getBottomLabel(label, x + i * PORT_WIDTH, y + PORT_WIDTH + LABEL_HEIGHT),
      port: {
        x: x + i * PORT_WIDTH,
        y: y + WIRE_LENGTH,
        type
      }
    }))
  }

  /**
   * Returns the groups of SVG elements (wires, labels, and ports).
   *
   * @returns {Object<{ wires: String[], labels: String[], ports: String[] }>}
   */
  getWireGroups = () => {
    const { width, height } = this.outerDimensions

    const left = this.getLeftWires(this.ports.left, height, 0)
    const right = this.getRightWires(this.ports.right, height, width - WIRE_LENGTH)
    const top = this.getTopWires(this.ports.top, width, 0)
    const bottom = this.getBottomWires(this.ports.bottom, width, height - WIRE_LENGTH)

    const get = (group, key) => group.map(e => e[key])

    return {
      lines: [
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
      connectors: [
        ...get(left, 'port'),
        ...get(right, 'port'),
        ...get(top, 'port'),
        ...get(bottom, 'port')
      ]
    }
  }

  /**
   * Renders the label of the integrated circuit block.
   *
   * @param {Number} width - width of the IC block
   * @param {Number} height - height of the IC block
   * @returns {String} SVG <text> element
   */
  getTitleLabel = (width, height) => {
    const labelWidth = this.title.length * TEXT_SIZE
    const x = width / 2
    const y = height / 2

    const label = this.getLabel(x, y, this.title, {
      'text-anchor': 'middle',
      'alignment-baseline': 'central'
    })

    return this.toSvg('svg', { width, height }, [label])
  }

  /**
   * Returns the inner rect of the IC.
   */
  getBoundary = () => {
    const width = this.outerDimensions.width - WIRE_LENGTH * 2
    const height = this.outerDimensions.height - WIRE_LENGTH * 2
    const rect = this.toSvg('rect', {
      width,
      height,
      stroke: this.primaryColor,
      'stroke-width': STROKE_WIDTH,
      fill: this.secondaryColor
    })

    const label = this.getTitleLabel(width, height)

    return this.toSvg('svg', {
      x: WIRE_LENGTH,
      y: WIRE_LENGTH,
      width,
      height,
      transform: `translate(${WIRE_LENGTH}, ${WIRE_LENGTH})`
    }, [rect, label])
  }

  /**
   * Returns the dimensions of the entire SVG.
   *
   * @returns {Object}
   */
  getOuterSvgDimensions = () => {
    const baseDim = PORT_WIDTH / 2 + PORT_WIDTH
    const getMaxDim = (a, b) => Math.max(this.ports[a].length, this.ports[b].length)

    const horzCount = getMaxDim('top', 'bottom')
    const vertCount = getMaxDim('left', 'right')

    const baseWidth = horzCount * PORT_WIDTH + horzCount * STROKE_WIDTH + baseDim
    const baseHeight = vertCount * PORT_WIDTH + vertCount * STROKE_WIDTH + baseDim

    let width = Math.max(baseWidth, this.title.length * TEXT_SIZE + MIN_WIDTH)
    let height = Math.max(baseHeight, MIN_HEIGHT)

    return { width, height }
  }

  /**
   * Returns the dimensions of the square block of the integrated circuit.
   *
   * @returns {Object}
   */
  getInnerSvgDimensions = () => {
    const offset = a => a.length ? 0 : 1
    const leftOffset = (offset(this.ports.left) + offset(this.ports.right)) * WIRE_LENGTH
    const topOffset = (offset(this.ports.top) + offset(this.ports.bottom)) * WIRE_LENGTH

    const offsetX = this.ports.left.length ? 0 : -WIRE_LENGTH
    const offsetY = this.ports.top.length ? 0 : -WIRE_LENGTH

    const width = this.outerDimensions.width - leftOffset
    const height = this.outerDimensions.height - topOffset

    return { width, height, offsetX, offsetY }
  }

  /**
   * Maps the coordinates of each port according to the given (x, y) offset.
   *
   * @param {Object[]}
   * @param {Number} offsetX
   * @param {Number} offsetY
   * @returns {Object[]}
   */
  getPortLocations = (ports, offsetX, offsetY) => {
    return ports
      .map(({ x, y, type }) => {
        return {
          x: x + offsetX,
          y: y + offsetY,
          type
        }
      })
  }

  /**
   * Returns the path, ports and dimensions of the rendered integrated circuit SVG.
   *
   * @returns {Object<{ ports: Object[], path: Buffer, width: Number, height: Number }>}
   */
  getSvgData = () => {
    const {
      width,
      height,
      offsetX,
      offsetY
    } = this.innerDimensions

    const { lines, labels, connectors } = this.getWireGroups()
    const boundary = this.getBoundary()

    const group = this.toSvg('g', {
      transform: `translate(${offsetX}, ${offsetY})`
    }, [
      boundary,
      ...lines,
      ...labels
    ])

    const svg = this.toSvg('svg', {
      width,
      height,
      xmlns: 'http://www.w3.org/2000/svg'
    }, [group])

    const path = this.toDataUrl(svg)

    return {
      path,
      ports: this.getPortLocations(connectors, offsetX, offsetY),
      width,
      height
    }
  }
}
