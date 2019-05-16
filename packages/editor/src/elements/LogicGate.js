import { Nor, Or } from '@aristotle/logic-circuit'
import { renderGate } from '@aristotle/logic-gates'
import Element from '../Element'
import LogicGateSVG from '../svg/lib/LogicGateSVG';

export default class LogicGate extends Element {
  constructor (id, { subtype }) {
    super(id, name)

    this.gateType = subtype
    this.node = this.getLogicGate(id)
    this.node.on('change', this.updateWireColor)
    this.svgRenderer = new LogicGateSVG({
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24',
      gateType: this.gateType,
      inputCount: this.settings.inputs.value
    })
    
    console.log('svgRenderersvgRenderersvgRenderersvgRenderersvgRenderersvgRenderersvgRenderersvgRenderersvgRenderersvgRenderer: ', this.svgRenderer)
    this.render()
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
    return this.svgRenderer.getSvgData() // renderGate('NOR', this.settings.inputs.value, color)
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
