import { InputNode, LogicValue } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'
import Element from '../Element'
import { IntegratedCircuitSVG } from '../svg'

export default class Switch extends Element {
  constructor (id) {
    super(id)

    this.node = new InputNode(id)

    const wires = {
      "top": [],
      "bottom": [
        {
          "label": "OUT_1",
          "type": "output"
        }],
      "left": [
        {
          "label": "OUT_1",
          "type": "output"
        }
      ],
      "right": [
      ]
    }
    
    this.node.on('change', this.updateWireColor)
    this.on('click', this.toggle)

    this.svgRenderer = new IntegratedCircuitSVG({
      title: 'sdfsdffsd',
      wires,
      primaryColor: '#ffffff',
      secondaryColor: '#1C1D24'
    })
    this.render()
  }

  settings = {
    // name: {
    //   type: 'text',
    //   value: ''
    // }
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render(false)
  }

  getSvg = (color) => {
    const bg = this.node.value === LogicValue.TRUE ? '66AD7C' : '808080'
    const posY = this.node.value === LogicValue.TRUE ? 15 : 48

    const svg = `
      <svg  xmlns="http://www.w3.org/2000/svg">
      <rect width="60" height="75" fill="#000000" stroke="#ffffff"
            stroke-width="2" vector-effect="non-scaling-stroke" />
      
      
      <rect width="15" height="40" x="22" y="15" fill="#${bg}"
            rx="2" ry="2"
            />
      
      <rect width="24" height="12" x="18" y="${posY}" 
            stroke="#000000"
            stroke-width="1" vector-effect="non-scaling-stroke"
            rx="2" ry="2"
            fill="#ffffff"  />
      
      <line x1="60" x2="96" y1="36" y2="36" stroke="#ffffff" stroke-width="2" />
    </svg>
    `.replace(/>\s+</g, '><').replace(/\s+/g, ' ')


    return this.svgRenderer.getSvgData()

    return {
      path: 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))),
      width: 96,
      height: 75,
      ports: [
        { x: 96, y: 36, type: 'output', id: 'ssfsdsdfdsdfs' }
      ]
    }


    return renderIc(svg, color, this.bgColor)
  }

  toggle = () => {
    const newValue = this.node.value === LogicValue.TRUE ? LogicValue.FALSE : LogicValue.TRUE
    this.node.setValue(newValue)
    this.canvas.step(true)
    this.canvas.circuit.queue.push(this.node)
    this.updateSelectionColor()
  }
}
