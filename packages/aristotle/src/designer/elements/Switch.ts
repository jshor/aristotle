import Element from '@/designer/Element'
import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'

export default class Switch extends Element {
  private bgColor: string = '#808080'

  constructor (id: string, name: string) {
    super(id, name)

    this.node = new InputNode(id)
    this.node.on('change', this.updateWireColor)
    this.render(true)
    super.on('click', this.toggle)
  }

  public updateWireColor = (value: number) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render()
  }

  public getSvg = (color: string) => {
    const svg = {
      left: [], right: [
        { label: '*', type: 'output' }
      ], top: [], bottom: []
    }

    return renderIc(svg, color, this.bgColor)
  }

  private toggle = () => {
    const newValue = this.node.value === LogicValue.TRUE ? LogicValue.FALSE : LogicValue.TRUE
    this.node.setValue(newValue)
    this.canvas.step(true)
    this.canvas.circuit.queue.push(this.node)
  }
}
