import Canvas from '@/designer/Canvas'
// @ts-ignore
import Gate from '@/designer/Gate.js'
import ic from '@aristotle/logic-gates'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class extends Vue {
  public panning: boolean = false
  public canvas: any
  public canvasWidth: number = 1600
  public canvasHeight: number = 1600

  public pan () {
    this.canvas.setMouseMode('PANNING')
  }

  public select () {
    this.canvas.setMouseMode('SELECTION')
  }

  public mounted () {
    this.canvas = new Canvas('canvas')

    this.canvas.add(new Gate('AND'), 50, 450)
    this.canvas.add(new Gate('NAND'), 50, 350)
  }

  public render () {
    return (
      <div id='app'>
        <button onClick={this.pan}>Panning Mode</button>
        <button onClick={this.select}>Select Mode</button>
        <div id='canvasWrapper'>
          <div
            id='canvas'
            style={{
              width: this.canvasWidth + 'px',
              height: this.canvasHeight + 'px'
            }}
          />
        </div>
      </div>
    )
  }
}
