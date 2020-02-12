import { Nor, Or } from '@aristotle/logic-circuit'
import CommandSetInputCount from '../commands/CommandSetInputCount'
import LogicGateSVG from '../svg/lib/LogicGateSVG'
import Element from '../core/Element'
import { ElementPropertyValues } from '../types'
import IElementProperties from '../interfaces/IElementProperties'

export default class LogicGate extends Element {
  constructor (id, properties: ElementPropertyValues) {
    super(id, properties)

    this.node = this.getLogicGate(id)
    this.node.on('change', this.setOutputConnectionColor)
    this.svgRenderer = new LogicGateSVG({
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24',
      gateType: this.properties.gateType.value,
      inputCount: this.properties.inputs.value
    })

    this.render()
  }

  public properties: IElementProperties = {
    inputs: {
      type: 'number',
      value: 2
    },
    gateType: {
      type: 'text', // TODO: 'readonly'
      value: 'NOR'
    }
  }

  public updateProperties = (properties: ElementPropertyValues): void => {
    if (properties.hasOwnProperty('inputs')) {
      // use a special command to handle input count changes
      const command = new CommandSetInputCount(this, properties['inputs'])

      this.canvas.commandStack.execute(command)
      this.persistToolbox()
    } else {
      // TS2340: Only public and protected methods of the base class are accessible via the 'super' keyword.
      // super.updateProperties(properties)
    }
  }

  getSvg = () => {
    return (this.svgRenderer as LogicGateSVG).getSvgData()
  }

  getLogicGate = (id) => {
    switch (this.properties.gateType.value) {
      case 'NOR':
        return new Nor(id)
      case 'OR':
      default:
        return new Or(id)
    }
  }
}
