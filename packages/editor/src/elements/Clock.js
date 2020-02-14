import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import IOElement from './IOElement'
import WaveService from '../services/WaveService'
import { TemplateSVG } from '../svg'

export default class Clock extends IOElement {
  constructor (id) {
    super(id)

    this.registerSvgRenderer()
    this.registerCircuitNode()
    this.on('added', this.registerClock)
    this.render()
  }

  settings = {
    ...this.settings,
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
    this.node = new InputNode(this.id)
    this.node.setValue(this.settings.startValue.value)
    this.node.on('change', this.updateVisualValue)
  }

  registerClock = () => {
    this.clock = new WaveService(`${this.id}_wave`, this.settings.interval.value)
    this.clock.onUpdate(this.invertValue)
    
    if (this.canvas) {
      this.canvas.oscillation.add(this.clock)
    }
  }

  resetInterval = () => {
    this.clock.setInterval(this.settings.interval.value)
  }

  getSvg = () => {
    const valueColor = this.getWireColor(this.node.value)

    return this
      .svgRenderer
      .setTemplateVariables({ valueColor })
      .getSvgData()
  }
}