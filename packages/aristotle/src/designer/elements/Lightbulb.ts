import Element from '@/designer/Element'
import { OutputNode } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'

export default class Lightbulb extends Element {
  private bgColor: string = '#808080'

  constructor (id: string, name: string) {
    super(id, name)

    this.node = new OutputNode(id)
    this.node.on('change', this.updateWireColor)
    this.render(true)
  }

  public updateWireColor = (value: number) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render()
  }

  public getSvg = (color: string) => {
    const svg = {
      right: [], left: [
        { label: '*', type: 'input' }
      ], top: [], bottom: []
    }

    return renderIc(svg, color, this.bgColor)
  }
}
