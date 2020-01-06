import { Nor, Or } from '@aristotle/logic-circuit'
import CommandSetInputCount from '../commands/CommandSetInputCount'
import LogicGateSVG from '../svg/lib/LogicGateSVG'
import Element from '../core/Element'

export default class LogicGate extends Element {
  constructor (id, params) {
    super(id, params)

    this.node = this.getLogicGate(id)
    this.node.on('change', this.setOutputConnectionColor)
    this.svgRenderer = new LogicGateSVG({
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24',
      gateType: this.settings.gateType.value,
      inputCount: this.settings.inputs.value
    })

    this.render()
  }

  settings = {
    inputs: {
      type: 'number',
      value: 2
    },
    gateType: {
      type: 'readonly',
      value: 'NOR'
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

  getSvg = () => {
    return (this.svgRenderer as LogicGateSVG).getSvgData()
  }

  getLogicGate = (id) => {
    switch (this.settings.gateType.value) {
      case 'NOR':
        return new Nor(id)
      case 'OR':
      default:
        return new Or(id)
    }
  }
}
