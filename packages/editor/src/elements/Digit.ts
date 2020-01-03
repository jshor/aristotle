import { OutputNode, LogicValue, CircuitNode } from '@aristotle/logic-circuit'
import Element from '../Element'
import getPortIndex from '../utils/getPortIndex'
import { DigitSVG } from '../svg'
import draw2d from 'draw2d'

export default class Lightbulb extends Element {
  protected nodes: OutputNode[] = []

  constructor (id, params) {
    super(id, params)

    this.registerSvgRenderer()
    this.registerCircuitNode()
    this.render()
  }

  settings = {
    name: {
      type: 'text',
      value: ''
    }
  }

  registerSvgRenderer = (): void => {
    this.svgRenderer = new DigitSVG({
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24'
    })
  }

  registerCircuitNode = (): void => {
    this.nodes = [
      this.createInput(),
      this.createInput(),
      this.createInput(),
      this.createInput()
    ]
  }

  /**
   * Creates a new output node for one bit representation.
   *
   * @returns {OutputNode}
   */
  createInput = (): OutputNode => {
    const node = new OutputNode()

    node.on('change', this.change)

    return node
  }

  /**
   * Returns the binary representation for the output nodes, in reverse order.
   *
   * @returns {String}
   */
  getBinaryValue = (): string => {
    return this
      .nodes
      .map(({ value }) => value === LogicValue.TRUE ? 1 : 0)
      .reverse()
      .join('')
  }

  /**
   * Returns the binary representation for the output nodes.
   *
   * @returns {String}
   */
  getHexadecimalValue = (): string => {
    return parseInt(this.getBinaryValue(), 2).toString(16)
  }

  /**
   * Repaints the SVG after an input change.
   */
  change = (): void => {
    const { path } = this.getSvg() as SvgData

    (this as draw2d.Figure).setPath(path) // TODO
  }

  /**
   * Returns the CircuitNode of the n-th port used by the given connection.
   *
   * @param {Connection} connection
   * @returns {CircuitNode}
   */
  getCircuitNode = (connection): CircuitNode => {
    const target = connection.getTarget()
    const index = getPortIndex(target, 'input')

    return this.nodes[index]
  }

  getSvg = (): SvgData => {
    const chars = this.getHexadecimalValue()
    const renderer = this.svgRenderer as DigitSVG

    return renderer
      .setChars(chars)
      .getSvgData()
  }
}
