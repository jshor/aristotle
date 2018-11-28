<script lang="tsx">
import Canvas from '../designer/Canvas'
import Gate from '../designer/Gate'
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class extends Vue {
  panning: boolean = false
  canvas: Canvas
  canvasWidth: number = 1600
  canvasHeight: number = 1600

  pan () {
    this.canvas.setMouseMode('PANNING')
  }

  select () {
    this.canvas.setMouseMode('SELECTION')
  }

  mounted () {
    this.canvas = new Canvas('canvas')
   
    this.canvas.add(new Gate('AND'), 50, 450)
    this.canvas.add(new Gate('NAND'), 50, 350)
  }

  render () {
    return (
      <div id="app">
        <button onClick={this.pan}>Panning Mode</button>
        <button onClick={this.select}>Select Mode</button>
        <div id="canvasWrapper">
          <div
            id="canvas"
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
</script>

<style>
#canvasWrapper {
  border: 1px dotted red;
  overflow: hidden;
  width: 800px;
  height: 800px;
}

#canvas svg {
  position: relative !important;
}
</style>