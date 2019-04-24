import { OutputNode, LogicValue } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'
import Element from '../Element'
import getPortIndex from '../utils/getPortIndex'



/**
 * Mapping of characters to numeric digit line.
 * The line index follows clockwise starting at the top left,
 * with the middle line having index 6.
 *     (1)
 *      _
 * (0) |_| (2)
 * (5) |_| (3)
 *     (4)
 *
 * @type {Object<{ String: Number[] }>}
 */
const charMap = {
  ' ': [0, 0, 0, 0, 0, 0, 0],
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 0, 1, 1, 0, 0, 0],
  2: [0, 1, 1, 0, 1, 1, 1],
  3: [0, 1, 1, 1, 1, 0, 1],
  4: [1, 0, 1, 1, 0, 0, 1],
  5: [1, 1, 0, 1, 1, 0, 1],
  6: [1, 1, 0, 1, 1, 1, 1],
  7: [0, 1, 1, 1, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 0, 1],
  a: [1, 1, 1, 1, 0, 1, 1],
  b: [1, 0, 0, 1, 1, 1, 1],
  c: [1, 1, 0, 0, 1, 1, 0],
  d: [0, 0, 1, 1, 1, 1, 1],
  e: [1, 1, 0, 0, 1, 1, 1],
  f: [1, 1, 0, 0, 0, 1, 1]
}

const paths = [
  'M 8,10 L 12,14 L 12,42 L 8,46 L 4,42 L 4,14 L 8,10 z',
  'M 10,8 L 14,4 L 42,4 L 46,8 L 42,12 L 14,12 L 10,8 z',
  'M 48,10 L 52,14 L 52,42 L 48,46 L 44,42 L 44,14 L 48,10 z',
  'M 48,50 L 52,54 L 52,82 L 48,86 L 44,82 L 44,54 L 48,50 z',
  'M 10,88 L 14,84 L 42,84 L 46,88 L 42,92 L 14,92 L 10,88 z',
  'M 8,50 L 12,54 L 12,82 L 8,86 L 4,82 L 4,54 L 8,50 z',
  'M 10,48 L 14,44 L 42,44 L 46,48 L 42,52 L 14,52 L 10,48 z',
]

function drawNumber (char) {
  const map = charMap[char]
  
  return paths
    .map((path, index) => ({
      fill: map[index] ? '71AC7C' : '262831',
      path
    }))
    .map(({ path, fill }) => `<path fill="#${fill}" d="${path}" />`)
    .join('')
}

function drawSequence (chars) {
  return chars
    .split('')
    .map((char, index) => {
      const x = 60 * index + 10
      const y = 10
      
      return `
        <g transform="translate(${x}, ${y})">
          ${drawNumber(char)}
        </g>
      `
    })
    .join('')
}

function drawSvg (chars) {
  const width = (chars.length * 60) + 10 + 4
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" >
      <g transform="scale(0.75)">
        <line x1="0" x2="40" y1="15" y2="15" stroke="#ffffff" stroke-width="3" />
        <line x1="0" x2="40" y1="42" y2="42" stroke="#ffffff" stroke-width="3" />
        <line x1="0" x2="40" y1="72" y2="72" stroke="#ffffff" stroke-width="3" />
        <line x1="0" x2="40" y1="100" y2="100" stroke="#ffffff" stroke-width="3" />
        <g transform="translate(40, 2)">
          <rect width="${width}" height="115" fill="#1C1D24" stroke="#ffffff" stroke-width="3" />
          ${drawSequence(chars)}
        </g>
      </g>
    </svg>
  `
  return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)))
}


export default class Lightbulb extends Element {
  constructor (id) {
    super(id)

    this.node = new OutputNode(id)
    this.node.on('change', this.updateWireColor)
    this.nodes = [
      this.createInput(),
      this.createInput(),
      this.createInput(),
      this.createInput()
    ]
    this.render()
  }

  createInput = () => {
    const node = new OutputNode()

    node.on('change', this.change)
    
    return node
  }

  getBinaryValue = () => {
    return this
      .nodes
      .map(({ value }) => value === LogicValue.TRUE ? 1 : 0)
      .reverse()
      .join('')
  }

  getHexadecimalValue = () => {
    return parseInt(this.getBinaryValue(), 2).toString(16)
  }

  change = () => {
    const value = this.getHexadecimalValue()
    const { path } = this.getSvg(value)
    
    this.setPath(path)
  }

  settings = {
    name: {
      type: 'text',
      value: ''
    }
  }

  getCircuitNode = (connection) => {
    const target = connection.getTarget()
    const index = getPortIndex(target, 'input')

    return this.nodes[index]
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render(false)
  }

  getSvg = () => {
    const value = this.getHexadecimalValue()

    console.log('value is: ', value)
    return {
      path: drawSvg(value),
      width: 178,
      height: 90,
      ports: [
        { x: 0, y: 12, type: 'input' },
        { x: 0, y: 32, type: 'input' },
        { x: 0, y: 54, type: 'input' },
        { x: 0, y: 74, type: 'input' }
      ]
    }
  }
}
