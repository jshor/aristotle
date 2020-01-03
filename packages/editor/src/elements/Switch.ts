import draw2d from 'draw2d'
import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import ToggleService from '../services/ToggleService'
import IOElement from './IOElement'
import { TemplateSVG } from '../svg'

export default class Switch extends IOElement {
  public clickableArea: draw2d.shape.basic.Rectangle

  constructor (id, params) {
    super(id, params)

    this.registerSvgRenderer()
    this.registerCircuitNode()
    this.attachClickableArea()
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
    this.node.setValue(this.settings.startValue.value)
    this.node.on('change', this.updateVisualValue)
  }

  attachClickableArea = () => {
    const locator = new draw2d.layout.locator.XYAbsPortLocator(15, 10)
    this.clickableArea = new draw2d.shape.basic.Rectangle({
      opacity: 0,
      width: 30,
      height: 50,
      cssClass: 'clickable'
    })
    this.clickableArea.on('click', this.invertValue)

    const el: draw2d.Figure = this as draw2d.Figure

    el.add(this.clickableArea, locator)
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
