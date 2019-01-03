<script lang="tsx">
import Editor from '../designer/Editor'
import { Component, Vue } from 'vue-property-decorator'
import MouseMode from '../types/MouseMode'
import CommandModel from '../models/CommandModel'
import SerializationService from '../services/SerializationService'

@Component<EditorComponent>({
  props: {
    data: String,
    relayedCommand: CommandModel
  },
  watch: {
    data (value) {
      console.log('this: ', value)
    },
    relayedCommand: {
      deep: true,
      handler (command: CommandModel) {
          this.canvas.applyCommand(command)
      }
    }
  }
})
export default class EditorComponent extends Vue {
  public data: String
  public relayedCommand: CommandModel
  public panning: boolean = false
  public canvas: any
  public canvasWidth: number = 1600
  public canvasHeight: number = 1600
  public id = 'test'

  public pan () {
    this.canvas.setMouseMode(MouseMode.PANNING)
  }

  public select () {
    this.canvas.setMouseMode(MouseMode.SELECTION)
  }

  public step () {
    this.canvas.step()
  }

  public mounted () {
    this.canvas = new Editor('canvas')

    this.canvas.on('select', () => this.onCanvasUpdate(this.canvas))
    this.canvas.on('commandStackChanged', () => this.onCanvasUpdate(this.canvas))

    SerializationService.deserialize(this.canvas)

  }

  onCanvasUpdate = (canvas: Editor) => {
    const model = canvas.getEditorModel()

    this.$store.commit('SET_EDITOR_MODEL', model)
    // console.log('model: ', model)
  }

  public render () {
    return (
      <div id='app'>
        COMD: { this.relayedCommand ? 'yes' : 'no' }
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
</script>

<style lang="scss" src="./styles/Editor.scss"></style>
