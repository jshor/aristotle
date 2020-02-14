import draw2d from 'draw2d'
import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import ToggleService from '../services/ToggleService'
import IOElement from './IOElement'
import { TemplateSVG } from '../svg'

export default class Switch extends IOElement {
  public nodeType: string = 'input'

  public clickableArea: draw2d.shape.basic.Rectangle

  constructor (id, params) {
    super(id, params)

    this.registerSvgRenderer()
    this.registerCircuitNode()
    this
      .attachClickableArea(30, 50, {
        x: 15,
        y: 10
      })
      .on('click', this.invertValue)
    this.render()
  }

  registerSvgRenderer = () => {
    this.svgRenderer = new TemplateSVG({
      template: 'switch',
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24'
    })
  }

  registerCircuitNode = () => {
    this.node = new InputNode(this.getId())
    this.node.setValue(this.properties.startValue.value)
    this.node.on('change', this.updateVisualValue)
  }

  getSvg = () => {
    const value = this.node.getProjectedValue()
    const valueColor = this.getWireColor(value)
    const y = value === LogicValue.TRUE ? 15 : 48
    const renderer = this.svgRenderer as TemplateSVG

    return renderer
      .setTemplateVariables({ valueColor, y })
      .getSvgData()
  }
}
