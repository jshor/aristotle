import { Nor, Or } from '@aristotle/logic-circuit'
import { renderGate } from '@aristotle/logic-gates'
import Element from '../Element'

export default class LogicGate extends Element {
  constructor (id, { subtype }) {
    super(id, name)

    this.gateType = subtype
    this.render()
    this.node = this.getLogicGate(id)
    this.node.on('change', this.updateWireColor)
  }

  settings = {
    inputs: {
      type: 'number',
      value: 2
    }
  }

  updateWireColor = (value) => {
    this.setOutputConnectionColor(this.getWireColor(value))
  }

  getSvg = (color) => {
    return renderGate('NOR', this.settings.inputs.value, color)
  }

  getLogicGate = (id) => {
    switch (this.gateType) {
      case 'NOR':
        return new Nor(id)
      case 'OR':
      default:
        return new Or(id)
    }
  }
}
