import Editor from '@/designer/Editor'
// @ts-ignore
import Gate from '@/designer/Gate'
import { Component, Vue } from 'vue-property-decorator'
import { LogicValue } from '@aristotle/logic-circuit'
import LogicGate from '@/designer/elements/gates/LogicGate'
import Switch from '@/designer/elements/inputs/Switch'
import Lightbulb from '@/designer/elements/outputs/Lightbulb'

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

  public step () {
    this.canvas.step()
  }

  public mounted () {
    this.canvas = new Editor('canvas')

    const R = new Switch('R')
    const S = new Switch('S')

    const NOR_1 = new LogicGate('NOR_1', 'NOR')
    const NOR_2 = new LogicGate('NOR_2', 'NOR')
    const NOR_3 = new LogicGate('NOR_3', 'NOR')

    const OUT_1 = new Lightbulb('OUT_1')
    const OUT_2 = new Lightbulb('OUT_2')

    this.canvas.addNode(NOR_3, 0, 100)
    this.canvas.addNode(R, 0, 350)
    this.canvas.addNode(S, 0, 450)
    this.canvas.addNode(NOR_1, 200, 350)
    this.canvas.addNode(NOR_2, 200, 450)
    this.canvas.addNode(OUT_1, 400, 350)
    this.canvas.addNode(OUT_2, 400, 450)

    this.canvas.newConnection(NOR_1, NOR_2, 1)
    this.canvas.newConnection(S, NOR_2, 0)
    this.canvas.newConnection(NOR_2, NOR_1, 1)
    this.canvas.newConnection(R, NOR_1, 0)
    this.canvas.newConnection(NOR_1, OUT_1, 0)
    this.canvas.newConnection(NOR_2, OUT_2, 0)

    R.setValue(LogicValue.TRUE)
    S.setValue(LogicValue.FALSE)
  }

  public render () {
    return (
      <div id='app'>
        <button onClick={this.pan}>Panning Mode</button>
        <button onClick={this.select}>Select Mode</button>
        <button onClick={this.step}>Step</button>
        <div id='canvasWrapper'>
          <div
            id='canvas'
            style={{
              width: '4998px', // this.canvasWidth + 'px',
              height: '4998px' // this.canvasHeight + 'px'
            }}
          />
        </div>
      </div>
    )
  }
}
