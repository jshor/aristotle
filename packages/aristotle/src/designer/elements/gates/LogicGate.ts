import Element from '@/designer/Element'
import { CircuitNode, Nor, Or } from '@aristotle/logic-circuit'
import { renderGate } from '@aristotle/logic-gates'

export default class LogicGate extends Element {
  private gateType: string

  constructor (name: string, gateType: string) {
    super(name)

    this.gateType = gateType
    this.render(true)
    this.node = this.getCircuitNode()
    this.node.on('change', this.updateWireColor)
  }

  private getCircuitNode = (): CircuitNode => {
    switch (this.gateType) {
      case 'NOR':
        return new Nor(this.name)
      case 'OR':
      default:
        return new Or(this.name)
    }
  }

  protected getSvg = (color: string) => {
    console.log('renderGate: ', renderGate)
    return renderGate('NOR', 2, color)
  }

  public updateWireColor = (value: string) => {
    this.setOutputConnectionColor(this.getWireColor(value))
  }
}
