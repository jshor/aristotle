import Element from '@/designer/Element'
import { OutputNode } from '@aristotle/logic-circuit'
import { renderIc } from '@aristotle/logic-gates'

export default class Lightbulb extends Element {
  private bgColor: string = '#808080'

  constructor (name: string) {
    super(name)

    this.node = new OutputNode(name)
    this.node.on('change', this.updateWireColor)
    this.render(true)
  }

  public updateWireColor = (value: string) => {
    this.bgColor = this.getWireColor(value)
    this.setOutputConnectionColor(this.bgColor)
    this.render()
  }

  protected getSvg = (color: string) => {
    console.log('renderGate: ', renderIc)
    const svg = {
      right: [], left: [
        { label: '*', type: 'input' }
      ], top: [], bottom: []
    }

    return renderIc(svg, color, this.bgColor)
  }
}
