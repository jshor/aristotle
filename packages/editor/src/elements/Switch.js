import draw2d from 'draw2d'
import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import ToggleService from '../services/ToggleService'
import Element from '../Element'
import { SwitchSVG } from '../svg'

export default class Switch extends Element {
  constructor (id) {
    super(id)

    this.svgRenderer = new SwitchSVG({
      template: 'switch',
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24'
    })
    this.node = new InputNode(id)
    this.node.on('change', this.updateWireColor)
    this.wave = new ToggleService(id)
    this.wave.onUpdate(this.toggle)
    this.render()
    this.attachClickableArea()
    console.log('renderingfffffffffffffff')
  }

  settings = {
    // name: {
    //   type: 'text',
    //   value: ''
    // }
  }

  attachClickableArea = () => {
    const locator = new draw2d.layout.locator.XYAbsPortLocator(15, 10)
    this.clickableArea = new draw2d.shape.basic.Rectangle({
      opacity: 0,
      width: 30,
      height: 50,
      cssClass: 'clickable'
    })
    this.clickableArea.on('click', this.toggle)
    this.add(this.clickableArea, locator)
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render(false)
  }

  getSvg = () => {
    const valueColor = this.getWireColor(this.node.value)
    const y = this.node.value === LogicValue.TRUE ? 15 : 48

    return this
      .svgRenderer
      .setTemplateVariables({ valueColor, y })
      .getSvgData()
  }

  toggle = () => {
    const newValue = this.node.value === LogicValue.TRUE ? LogicValue.FALSE : LogicValue.TRUE

    this.node.setValue(newValue)
    this.canvas.step(true)
    this.wave.drawPulseChange()

    // input nodes changes require triggering the head of the circuit queue
    this.canvas.circuit.queue.push(this.node)

    this.updateSelectionColor()
  }
}
