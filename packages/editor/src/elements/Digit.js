import { OutputNode, LogicValue } from '@aristotle/logic-circuit'
import Element from '../Element'
import getPortIndex from '../utils/getPortIndex'
import { DigitSVG } from '../svg'

export default class Lightbulb extends Element {
  constructor (id) {
    super(id)

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

  registerSvgRenderer = () => {
    this.svgRenderer = new DigitSVG({
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24'
    })
  }

  registerCircuitNode = () => {
    this.nodes = Array(4).fill(this.createInput)
  }

  /**
   * Creates a new output node for one bit representation.
   *
   * @returns {OutputNode}
   */
  createInput = () => {
    const node = new OutputNode()

    node.on('change', this.change)

    return node
  }

  /**
   * Returns the binary representation for the output nodes, in reverse order.
   *
   * @returns {String}
   */
  getBinaryValue = () => {
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
  getHexadecimalValue = () => {
    return parseInt(this.getBinaryValue(), 2).toString(16)
  }

  /**
   * Repaints the SVG after an input change.
   */
  change = () => {
    const { path } = this.getSvg()

    this.setPath(path)
  }

  /**
   * Returns the CircuitNode of the n-th port used by the given connection.
   *
   * @param {Connection} connection
   * @returns {CircuitNode}
   */
  getCircuitNode = (connection) => {
    const target = connection.getTarget()
    const index = getPortIndex(target, 'input')

    return this.nodes[index]
  }

  getSvg = () => {
    const chars = this.getHexadecimalValue()

    this.svgRenderer.setChars(chars)

    return this.svgRenderer.getSvgData()
  }
}
