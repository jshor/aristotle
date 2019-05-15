import draw2d from 'draw2d'
import { InputNode, LogicValue } from '@aristotle/logic-circuit'
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
    this.render()
    this.attachClickableArea()
  }

  settings = {
    // name: {
    //   type: 'text',
    //   value: ''
    // }
  }

  attachClickableArea = () => {
    const locator = new draw2d.layout.locator.XYAbsPortLocator(15, 10)
    const clickableArea = new draw2d.shape.basic.Rectangle({
      opacity: 0,
      width: 30,
      height: 50,
      cssClass: 'clickable'
    })

    clickableArea.on('click', this.doToggle)
    this.add(clickableArea, locator)
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render(false)
  }

  getSvg = (color) => {
    const valueColor = this.node.value === LogicValue.TRUE ? '#66AD7C' : '#808080'
    const y = this.node.value === LogicValue.TRUE ? 15 : 48

    return this
      .svgRenderer
      .setTemplateVariables({ valueColor, y })
      .getSvgData()
  }

  doToggle = () => {
    const newValue = this.node.value === LogicValue.TRUE ? LogicValue.FALSE : LogicValue.TRUE

    this.toggle(newValue)
  }

  toggle = (newValue) => {
    this.node.setValue(newValue)
    this.canvas.step(true)
    this.canvas.circuit.queue.push(this.node)
    this.updateSelectionColor()
  }
}
