import Element from '@/designer/Element'
import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'

export default class Switch extends Element {
  constructor (id) {
    super(id)

    this.node = new InputNode(id)
    this.node.on('change', this.updateWireColor)
    this.render()
    this.on('click', this.toggle)
  }

  settings = {
    // name: {
    //   type: 'text',
    //   value: ''
    // }
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render(false)
  }

  getSvg = (color) => {
    const svg = {
      left: [],
      right: [
        { label: '*', type: 'output' }
      ],
      top: [],
      bottom: []
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
