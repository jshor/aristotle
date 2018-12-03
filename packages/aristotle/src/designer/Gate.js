import draw2d from 'draw2d'

// gate svg imports
import svgAnd from '@/assets/logical-and.svg'
import svgNand from '@/assets/logical-nand.svg'
import svgXnor from '@/assets/logical-xnor.svg'
import svgOr from '@/assets/logical-or.svg'

import render from '@aristotle/logic-gates'
import { Nor, InputNode, OutputNode, LogicValue } from '@aristotle/logic-circuit'

const Gates = {
    AND: 'AND',
    NAND: 'NAND',
    OR: 'OR',
    NOR: 'NOR',
    XOR: 'XOR',
    XNOR: 'XNOR'
}

// const svg = {
//   top: [
//     { label: 'ABC', type: 'input' },
//     { label: 'B', type: 'input' },
//     { label: 'CEEEE', type: 'input' },
//     { label: 'DEF', type: 'input' }
//   ],
//   left: [
//     { label: 'ABC', type: 'input' },
//     { label: 'EDB', type: 'input' }
//   ],
//   bottom: [
//     { label: 'Q', type: 'input' },
//     { label: 'sfdfsd', type: 'input' }
//   ],
//   right: [
//     { label: 'EWAA', type: 'output' },
//     { label: 'BDE', type: 'output' },
//     { label: 'SS', type: 'output' },
//     { label: 'RRR', type: 'output' }
//   ]
// }

class Gate extends draw2d.shape.basic.Image {
  constructor (gateType, name) {
    super({ resizeable: false })

    this.gateType = gateType
    this.name = name
    this.render()
    this.on('click', this.click)
    this.on('added', this.addEventListeners)
    this.cssClass = 'basic-image'
  }

  addEventListeners = () => {
    this.canvas.on('select', this.updateSelectionColor)
    this.canvas.on('reset', this.updateSelectionColor)
    this.canvas.html[0].addEventListener('click', this.updateSelectionColor)
  }

  render = () => {
    const svg = {
      left: [], right: [], top: [], bottom: []
    }

    if (this.gateType === 'Nor') {
      svg.left = [
        { label: 'IN1', type: 'input' },
        { label: 'IN2', type: 'input' }
      ]
      svg.right = [
        { label: 'OUT', type: 'output' }
      ]
      this.node = new Nor(this.name)
    } else if (this.gateType === 'Input') {
      svg.right = [
        { label: '*', type: 'output' }
      ]
      this.node = new InputNode(this.name)
    } else {
      svg.left = [
        { label: '@', type: 'input' }
      ]
      this.node = new OutputNode(this.name)
      this.node.on('change', (value) => {
        console.log('Output got value: ', value)
      })
    }

    this.svg = svg

    const { path, width, height, ports } = render(svg, '#000')

    this.setPath(path)
    this.setWidth(width)
    this.setHeight(height)
    this.setPorts(ports)
    this.node.on('change', this.updateValue)
  }

  updateValue = (value) => {
    console.log(`${this.name} updated to ${value}`)
    let newColor = '#808080'

    if (value === LogicValue.TRUE) {
      newColor = '#0000ff'
    } else if (value === LogicValue.FALSE) {
      newColor = '#ff0000'
    }

    this.setOutputConnectionColor(newColor)
  }

  setValue = (value) => {
    this.node.setValue(value)
    this.updateValue(value)
  }

  updateSelectionColor = () => {
    if (this.canvas) {
      const isSelected = !!~this.canvas.selection.all.data.indexOf(this)
      const color = isSelected ? '#ff0000' : '#000'

      this.setPath(render(this.svg, color).path)
    }
  }

  setPorts = (ports) => {
    ports.forEach(({ x, y, type }) => {
      this.createPort(type, new draw2d.layout.locator.XYAbsPortLocator(x, y))
    })
  }

  setOutputConnectionColor = (color) => {
    this
      .getConnections()
      .data
      .filter((connection) => connection.getSource().parent === this)
      .forEach((connection) => connection.setColor(color))
  }

  click = () => {
    // this.setOutputConnectionColor('#0000ff')
  }
}

export default Gate
