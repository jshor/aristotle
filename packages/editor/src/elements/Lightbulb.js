import { OutputNode } from '@aristotle/logic-circuit'
// import { renderIc } from '@aristotle/logic-gates'
import Element from '../Element'

export default class Lightbulb extends Element {
  constructor (id) {
    super(id)

    this.node = new OutputNode(id)
    this.node.on('change', this.updateWireColor)
    this.render()
  }

  settings = {
    name: {
      type: 'text',
      value: ''
    }
  }

  updateWireColor = (value) => {
    this.bgColor = this.getWireColor(value)
    this.render(false)
  }

  getSvg = (color) => {
    const svg = {
      right: [],
      left: [
        { label: '*', type: 'input' }
      ],
      top: [],
      bottom: []
    }

    const path = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSI5MCIgaGVpZ2h0PSI2MCIgc3Ryb2tlPSJ1bmRlZmluZWQiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0iI2ZmZiIgLz48bGluZSB4MT0iMCIgeDI9IjMwIiB5MT0iNjAiIHkyPSI2MCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiMwMDAiIC8+PHRleHQgeD0iMzYiIHk9IjY0IiBmb250LWZhbWlseT0iTHVjaWRhIENvbnNvbGUsIE1vbmFjbywgbW9ub3NwYWNlIiBmb250LXNpemU9IjEyIj4qPC90ZXh0Pjwvc3ZnPg=='
    

    return  {path,"ports":[{"x":0,"y":60,"type":"input"}],"width":150,"height":120}
    
  }
}
