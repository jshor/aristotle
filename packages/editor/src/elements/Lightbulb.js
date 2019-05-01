import { OutputNode } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'
import Element from '../Element'

export default class Lightbulb extends Element {
  constructor (id) {
    super(id)

    this.node = new OutputNode(id)
    this.node.on('change', this.updateWireColor)
    this.render()
  }

  settings = {
    name: {
      type: 'text',
      value: ''
    }
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render(false)
  }

  getSvg = (color) => {
    const svg = {
      right: [],
      left: [
        { label: '*', type: 'input' }
      ],
      top: [],
      bottom: []
    }

    return renderIc(svg, color, this.bgColor)
  }
}
