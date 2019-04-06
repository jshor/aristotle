import Element from '@/designer/Element'
import { Nor, Or } from '@aristotle/logic-circuit'
import { renderGate } from '@aristotle/logic-gates'

export default class LogicGate extends Element {
  constructor (id, name, gateType) {
    super(id, name)

    this.gateType = gateType
    this.render(true)
    this.node = this.getCircuitNode(id)
    this.node.on('change', this.updateWireColor)
    this.hasToolbox = true
  }

  settings = {
    ports: {
      type: 'number',
      value: 2
    }
  }

  updateWireColor = (value) => {
    this.setOutputConnectionColor(this.getWireColor(value))
  }

  getSvg = (color) => {
    return renderGate('NOR', this.settings.ports.value, color)
  }

  getCircuitNode = (id) => {
    switch (this.gateType) {
      case 'NOR':
        return new Nor(id)
      case 'OR':
      default:
        return new Or(id)
    }
  }
}
