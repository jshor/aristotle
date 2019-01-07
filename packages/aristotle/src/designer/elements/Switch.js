import Element from '@/designer/Element'
import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'

export default class Switch extends Element {
  constructor (id, name) {
    super(id, name)

    this.node = new InputNode(id)
    this.node.on('change', this.updateWireColor)
    this.render(true)
    this.on('click', this.toggle)
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render()
  }

  getSvg = (color) => {
    const svg = {
      left: [], right: [
        { label: '*', type: 'output' }
      ], top: [], bottom: []
    }

    return renderIc(svg, color, this.bgColor)
  }

  toggle = () => {
    const newValue = this.node.value === LogicValue.TRUE ? LogicValue.FALSE : LogicValue.TRUE
    this.node.setValue(newValue)
    this.canvas.step(true)
    this.canvas.circuit.queue.push(this.node)
  }
}
