<script lang="tsx">
import { Component, Vue } from 'vue-property-decorator'
import DocumentModel from '../models/DocumentModel'
import Command from '../types/Command'

@Component<Toolbar>({
  props: {
    document: DocumentModel
  }
})
export default class Toolbar extends Vue {
  public document: DocumentModel

  public relayCommand (command: Command, payload?: any) {
    return this.$emit('relayCommand', { command, payload })
  }

  public render () {
    const {
      canUndo,
      canRedo
    } = this.document.editorModel

    return (
      <div>
        <button
          disabled={!canUndo}
          onClick={() => this.relayCommand(Command.UNDO)}>
          Undo
        </button>
        <button
          disabled={!canRedo}
          onClick={() => this.relayCommand(Command.REDO)}>
          Redo
        </button>
      </div>
    )
  }
}
</script>
