import draw2d from 'draw2d'
import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import IOElement from './IOElement'
import WaveService from '../services/WaveService'
import IElementProperties from '../interfaces/IElementProperties'
import { TemplateSVG } from '../svg'
import { ElementPropertyValues } from '../types'

export default class Clock extends IOElement {
  public nodeType: string = 'input'

  private clock: WaveService

  public clickableArea: draw2d.shape.basic.Rectangle

  constructor (id: string, properties: ElementPropertyValues) {
    super(id, properties)

    this.registerSvgRenderer()
    this.registerCircuitNode()
    this
      .attachClickableArea(30, 30, {
        x: 10,
        y: 10
      })
      .on('click', this.invertValue)
    this.on('added', this.registerClock)
    this.on('removed', this.unregisterClock)

    this.render()
  }

  public properties: IElementProperties = {
    ...this.properties,
    interval: {
      type: 'number',
      step: 100,
      value: 1000,
      min: 100,
      onUpdate: () => this.resetInterval()
    }
  }

  registerSvgRenderer = () => {
    this.svgRenderer = new TemplateSVG({
      template: 'clock',
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24'
    })
  }

  registerCircuitNode = () => {
    this.node = new InputNode(this.getId())
    this.node.setValue(this.getPropertyValue('startValue'))
    this.node.on('change', this.updateVisualValue)
  }

  registerClock = () => {
    this.clock = new WaveService(`${this.getId()}_wave`, this.getPropertyValue('interval'))
    this.clock.onUpdate(this.invertValue)

    if (this.canvas) {
      this.canvas.oscillation.add(this.clock)
    }
  }

  unregisterClock = () => {
    this.canvas.oscillation.remove(this.clock)
  }

  resetInterval = () => {
    this.clock.setInterval(this.getPropertyValue('interval'))
  }

  getSvg = () => {
    const valueColor = this.getWireColor(this.node.getProjectedValue())
    const renderer = this.svgRenderer as TemplateSVG

    return renderer
      .setTemplateVariables({ valueColor })
      .getSvgData()
  }
}
