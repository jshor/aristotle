import { Nor, Or } from '@aristotle/logic-circuit'
import CommandSetInputCount from '../commands/CommandSetInputCount'
import LogicGateSVG from '../svg/lib/LogicGateSVG'
import Element from '../Element'

export default class LogicGate extends Element {
  constructor (id, { subtype }) {
    super(id)

    this.gateType = subtype
    this.node = this.getLogicGate(id)
    this.node.on('change', this.setOutputConnectionColor)
    this.svgRenderer = new LogicGateSVG({
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24',
      gateType: this.gateType,
      inputCount: this.settings.inputs.value
    })
    
    this.render()
  }

  settings = {
    inputs: {
      type: 'number',
      value: 2
    }
  }

  updateSettings = (settings) => {
    if (settings.hasOwnProperty('inputs')) {
      // use a special command to handle input count changes
      const command = new CommandSetInputCount(this, settings.inputs)

      this.canvas.commandStack.execute(command)
      this.persistToolbox()
    } else {
      super.updateSettings(settings)
    }
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
