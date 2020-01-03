import SVGBase from './SVGBase'

/**
 * Mapping of characters to numeric digit line.
 * The line index follows clockwise starting at the top left,
 * with the middle line having index 6.
 *
 *     (1)
 *      _
 * (0) |_| (2)
 * (5) |_| (3)
 *
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

const DIGIT_WIDTH = 60
const DIGIT_PADDING = 10
const DIGIT_DISPLAY_HEIGHT = 115
const DIGIT_SVG_SCALE = 0.75
const WIRE_LENGTH = 40
const DIGIT_PORTS = [15, 42, 72, 100]
const DIGIT_LINE_SPACING = 4

const paths = [
  'M 8,10 L 12,14 L 12,42 L 8,46 L 4,42 L 4,14 L 8,10 z',
  'M 10,8 L 14,4 L 42,4 L 46,8 L 42,12 L 14,12 L 10,8 z',
  'M 48,10 L 52,14 L 52,42 L 48,46 L 44,42 L 44,14 L 48,10 z',
  'M 48,50 L 52,54 L 52,82 L 48,86 L 44,82 L 44,54 L 48,50 z',
  'M 10,88 L 14,84 L 42,84 L 46,88 L 42,92 L 14,92 L 10,88 z',
  'M 8,50 L 12,54 L 12,82 L 8,86 L 4,82 L 4,54 L 8,50 z',
  'M 10,48 L 14,44 L 42,44 L 46,48 L 42,52 L 14,52 L 10,48 z',
]

export default class DigitSVG extends SVGBase {
  private chars: string

  /**
   * Constructor.
   *
   * @inheritdoc
   * @param {String} options.chars - characters to render
   */
  constructor (options) {
    super(options)

    this.chars = options.chars
  }

  /**
   * Renders a string with all SVG paths to represent the given character.
   * The paths will be filled in according to how the digit is represented in the digit map.
   * See the digit map constant for more details.
   *
   * @param {string} char - single character to represent
   * @returns {string} joined <path> SVG elements
   */
  getNumber = (char: string): string => {
    const map = charMap[char]

    return paths
      .map((path, index) => ({
        fill: map[index] ? '71AC7C' : '262831',
        path
      }))
      .map(({ path, fill }) => `<path fill="#${fill}" d="${path}" />`)
      .join('')
  }

  /**
   * Renders a <g> SVG element with rendered digit character(s) present.
   *
   * @param {string} chars - characters to render
   * @returns {string} SVG element
   */
  getSequence = (chars: string): string => {
    return chars
      .split('')
      .map((char, index) => {
        const x = DIGIT_WIDTH * index + DIGIT_PADDING
        const y = DIGIT_PADDING

        return this.toSvg('g', {
          transform: `translate(${x}, ${y})`
        }, [this.getNumber(char)])
      })
      .join('')
  }

  /**
   * Renders a horizontal wire (line).
   *
   * @param {number} y - y-axis coordinate to start the line
   * @returns {string} svg rendering of the horizontal line
   */
  getInputLine = (y: number): string => {
    return this.toSvg('line', {
      x1: 0,
      x2: WIRE_LENGTH,
      y1: y,
      y2: y,
      stroke: this.primaryColor,
      'stroke-width': 3
    })
  }

  /**
   * Sets the character(s) to display.
   *
   * @param {string} chars
   * @returns {DigitSVG}
   */
  setChars = (chars: string): DigitSVG => {
    this.chars = chars

    return this
  }

  /**
   * Renders the box with the digit characters in it.
   *
   * @returns {string} SVG element
   */
  getDigitDisplay = (width: number, height: number): string => {
    return this.toSvg('g', {
      transform: `translate(${WIRE_LENGTH}, 2)`
    }, [
      this.toSvg('rect', {
        width,
        height,
        fill: this.secondaryColor,
        stroke: this.primaryColor,
        'stroke-width': 3
      }),
      this.getSequence(this.chars)
    ])
  }

  /**
   * Returns the definitions for the ports.
   * All ports are inputs, as this is a terminal node.
   *
   * @returns {PortDefinition[]}
   */
  getPortDefinitions = (): PortDefinition[] => {
    return [12, 32, 54, 75].map((y: number): PortDefinition => ({
      type: 'input',
      x: 0,
      y
    }))
  }

  /**
   * Returns the path, ports and dimensions of the rendered digit SVG.
   *
   * @returns {SvgData}
   */
  getSvgData = (): SvgData => {
    const digitWidth = (this.chars.length * DIGIT_WIDTH) + DIGIT_PADDING + DIGIT_LINE_SPACING
    const width = digitWidth + DIGIT_PADDING + DIGIT_LINE_SPACING
    const height = DIGIT_DISPLAY_HEIGHT

    const digitDisplay = this.getDigitDisplay(digitWidth, height)
    const lines = DIGIT_PORTS.map(this.getInputLine)

    /* render the entire figure */
    const figure = this.toSvg('g', {
      transform: `scale(${DIGIT_SVG_SCALE})`
    }, [lines, digitDisplay])

    /* create the port definitions */
    const ports = this.getPortDefinitions()

    const svg = this.toSvg('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width,
      height
    }, [figure])

    const path = this.toDataUrl(svg)

    return {
      path,
      ports,
      width,
      height
    }
  }
}
