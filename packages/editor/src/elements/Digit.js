import { OutputNode, LogicValue } from '@aristotle/logic-circuit'
import Element from '../Element'
import getPortIndex from '../utils/getPortIndex'
import { DigitSVG } from '../svg'

export default class Lightbulb extends Element {
  constructor (id) {
    super(id)

    this.node = new OutputNode(id)
    this.node.on('change', this.updateWireColor)
    this.svgRenderer = new DigitSVG({
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24'
    })
    this.nodes = Array(4).fill(this.createInput)
    this.render()
  }

  settings = {
    name: {
      type: 'text',
      value: ''
    }
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
    const chars = this.getHexadecimalValue()

    this.svgRenderer.setChars(chars)

    return this.svgRenderer.getSvgData()
  }
}
