import Element from '@/designer/Element'
import { OutputNode } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'

export default class Lightbulb extends Element {
  constructor (id, name) {
    super(id, name)

    this.node = new OutputNode(id)
    this.node.on('change', this.updateWireColor)
    this.render(true)
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render()
  }

  getSvg = (color) => {
    const svg = {
      right: [], left: [
        { label: '*', type: 'input' }
      ], top: [], bottom: []
    }

    return renderIc(svg, color, this.bgColor)
  }
}
