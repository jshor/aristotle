<script lang="tsx">
import { Component, Vue } from 'vue-property-decorator'
import { mapGetters, mapState } from 'vuex'
import Command from '../types/Command'
import Editor from '@/components/Editor.vue'
import Toolbar from '@/components/Toolbar.vue'
import DocumentModel from '../models/DocumentModel'
import EditorModel from '../models/EditorModel'
import CommandModel from '../models/CommandModel'
import { State } from '../store'

@Component<DocumentContainer>({
  computed: {
    ...mapGetters(['activeDocument']),
    ...mapState({
      relayedCommand: (state: State) => state.documents.relayedCommand
    })
  },
  components: {
    Editor,
    Toolbar
  }
})
export default class DocumentContainer extends Vue {
  public activeDocument: DocumentModel
  public relayedCommand: CommandModel

  public onRelayCommand = ({ command, payload }: { command: Command, payload: any }) => {
    this.$store.commit('RELAY_COMMAND', new CommandModel(command, payload))
  }

  public onUpdateEditor = (editorModel: EditorModel) => {
    this.$store.commit('SET_EDITOR_MODEL', editorModel)
  }

  public render () {
    return (
      <div>
        Cmd: { this.relayedCommand }
        <Toolbar
          document={this.activeDocument}
          onRelayCommand={this.onRelayCommand}
        />
        <Editor
          document={this.activeDocument}
          relayedCommand={this.relayedCommand}
          onUpdateEditor={this.onUpdateEditor}
        />
      </div>
    )
  }
}
</script>
