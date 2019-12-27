import { OutputNode, LogicValue } from '@aristotle/logic-circuit'
import { TemplateSVG } from '../svg'
import Element from '../Element'

export default class Lightbulb extends Element {
  constructor (id) {
    super(id)

    this.node = new OutputNode(id)
    this.node.on('change', this.updateWireColor)
    this.registerSvgRenderer()
    this.render()
  }

  settings = {
    name: {
      type: 'text',
      value: ''
    }
  }

  registerSvgRenderer = () => {
    this.svgRenderer = new TemplateSVG({
      template: 'lightbulb',
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24'
    })
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.render(false)
  }


  getSvg = () => {
    const valueColor = this.getWireColor(this.node.value)
    const filter = this.node.value === LogicValue.TRUE
      ? 'lightbulbGlow'
      : 'lightbulbOff'
    const outlineColor = this.node.value === LogicValue.TRUE
      ? valueColor
      : '#ffffff'

    return this
      .svgRenderer
      .setTemplateVariables({ valueColor, outlineColor, filter })
      .getSvgData()
  }
}