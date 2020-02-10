import SVGBase from './SVGBase'
import { PortDefinition, SvgData } from '../../types'

const PORT_WIDTH = 30
const STROKE_WIDTH = 2
const WIRE_LENGTH = 40
const LOGIC_GATE_WIDTH = 100
const LOGIC_GATE_HEIGHT = 50

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

export default class LogicGateSVG extends SVGBase {
  private inputCount: number

  private gateType: string

  private baseLineAttrs = {
    'stroke': this.primaryColor,
    'stroke-linecap': 'square',
    'stroke-width': STROKE_WIDTH,
    'vector-effect': 'non-scaling-stroke'
  }

  constructor (options) {
    super(options)

    this.inputCount = options.inputCount
    this.gateType = options.gateType
  }

  /**
   * Renders a set of horizontal wire(s) for the given parameters.
   *
   * @param {number} wireCount - number of wires to render
   * @param {number} x-axis offset
   * @param {number} svgHeight - total outer height of the SVG
   * @returns {string[]} list of <line> elements
   */
  getWires = (wireCount: number, x: number, svgHeight: number): string[] => {
    const inputHeight = (wireCount - 1) * PORT_WIDTH
    const yOffset = svgHeight / 2 - inputHeight / 2
    const wires = []

    for (let i = 0; i < wireCount; i++) {
      wires.push(this.toSvg('line', {
        x1: x,
        x2: x + WIRE_LENGTH,
        y1: yOffset + i * PORT_WIDTH,
        y2: yOffset + i * PORT_WIDTH,
        ...this.baseLineAttrs
      }))
    }

    return wires
  }

  /**
   * Calculates the locations of the input ports.
   *
   * @param {number} svgHeight - total outer height of the SVG
   * @returns {PortDefinition[]}
   */
  getInputPorts = (svgHeight: number): PortDefinition[] => {
    const inputHeight = (this.inputCount - 1) * PORT_WIDTH
    const yOffset = svgHeight / 2 - inputHeight / 2
    const ports = []

    for (let i = 0; i < this.inputCount; i++) {
      const x = 0
      const y = yOffset + i * PORT_WIDTH

      ports.push({ x, y, type: 'input' })
    }

    return ports
  }

  /**
   * Returns the inner figure (the gate minus the wires or symbols).
   *
   * @param {number} x - x-axis offset
   * @param {String} pathData - SVG path of the figure
   * @returns {string} SVG
   */
  getFigureSvg = (x: number, pathData: string): string => {
    const path = this.toSvg('path', {
      d: pathData,
      fill: this.secondaryColor,
      ...this.baseLineAttrs
    })

    return this.toSvg('svg', {
      height: '100%',
      viewBox: '0 0 16 7.25',
      preserveAspectRatio: 'none',
      x
    }, [path])
  }

  /**
   * Returns the inner figure path for the gate type.
   *
   * @returns {string} SVG path data
   */
  getPathData = (): string => {
    switch (this.gateType) {
      case 'AND':
      case 'NAND':
        return PATH.AND
      case 'OR':
      case 'XOR':
      case 'XNOR':
      default:
        return PATH.OR
    }
  }

  /**
   * Determines whether a negation symbol is required for the gate type.
   *
   * @returns {boolean}
   */
  isNegated = (): boolean => {
    return ['XNOR', 'NOR', 'NAND'].includes(this.gateType)
  }

  /**
   * Renders a negation symbol.
   *
   * @param {number} height - total SVG height
   * @returns {string} SVG <circle> element
   */
  getNegation = (height: number): string => {
    const x = NEGATION_X[this.gateType]
    const r = 4

    if (x) {
      return this.toSvg('circle', {
        cx: x,
        cy: height / 2,
        r,
        fill: this.secondaryColor,
        ...this.baseLineAttrs
      })
    }
    return ''
  }

  /**
   * Sets the input count.
   *
   * @param {number} inputCount
   */
  setInputCount = (inputCount: number): void => {
    this.inputCount = inputCount
  }

  /**
   * Returns the path, ports and dimensions of the rendered logic gate SVG.
   *
   * @returns {SvgData}
   */
  getSvgData = (): SvgData => {
    const height = this.inputCount > 2
      ? this.inputCount * PORT_WIDTH + this.inputCount * STROKE_WIDTH
      : LOGIC_GATE_HEIGHT
    const width = LOGIC_GATE_WIDTH
    const pathData = this.getPathData()
    const children = [
      ...this.getWires(this.inputCount, 0, height),
      ...this.getWires(1, width - WIRE_LENGTH, height),
      this.getFigureSvg(20, pathData)
    ]

    // if (this.gateType === GateType.XOR || GateType.XNOR) {
    if (this.gateType === 'XOR' || this.gateType === 'XNOR') {
      // add the curve at the bottom of XOR gates
      children.push(this.getFigureSvg(10, PATH.XOR_BASE))
    }

    children.push(this.getNegation(height))

    const svg = this.toSvg('svg', {
      width,
      height,
      xmlns: 'http://www.w3.org/2000/svg'
    }, children)

    const path = this.toDataUrl(svg)

    const outputPort: PortDefinition = {
      x: width,
      y: height / 2,
      type: 'output'
    }
    const ports = this
      .getInputPorts(height)
      .concat(outputPort)

    return {
      path,
      width,
      height,
      ports
    }
  }
}
