<template>
  <document>
    <template v-slot:editor>
      <div
        :id="document.id"
        :style="{
          width: '4998px',
          height: '4998px'
        }"
      />
    </template>
    
    <template v-slot:oscilloscope>
      <div class="oscilloscope-inner">OSCILLOSCOPE YAY</div>
    </template>
  </document>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Toolbar from '@/components/Toolbar'
import Toolbox from '@/components/Toolbox'
import Document from '@/components/Document'
import { Editor, CommandModel } from '@aristotle/editor'
import DocumentModel from '@/models/DocumentModel'

export default {
  name: 'DocumentContainer',
  components: {
    Editor,
    Toolbar,
    Toolbox,
    Document
  },
  data () {
    return {
      canvas: null
    }
  },
  props: {
    document: {
      type: DocumentModel,
      required: true
    }
  },
  computed: {
    ...mapState(['relayedCommand'])
  },
  watch: {
    relayedCommand: {
      deep: true,
      handler (command) {
        this.canvas.applyCommand(command)
      }
    }
  },
  methods: {
    onRelayCommand ({ command, payload }) {
      this.$store.commit('RELAY_COMMAND', new CommandModel(command, payload))
    },
    onUpdateEditor (editorModel) {
      this.$store.commit('SET_EDITOR_MODEL', editorModel)
    },
    toolboxChanged (payload) {
      this.onRelayCommand({ command: 'UPDATE_ELEMENT', payload })
    },
    closeToolbox () {
      this.$store.commit('SET_TOOLBOX_VISIBILITY', false)
    },
    pan () {
      this.canvas.setMouseMode('PANNING')
    },
    select () {
      this.canvas.setMouseMode('SELECTION')
    },
    step () {
      this.canvas.step()
    },
    onCanvasUpdate (canvas) {
      const model = canvas.getEditorModel() // should be v-model (emit `value`)

      this.$store.commit('SET_EDITOR_MODEL', model)
      this.$store.commit('SET_TOOLBOX_VISIBILITY', false)
    },
    onToolbox (editor, settings) {
      this.$store.commit('SET_TOOLBOX_SETTINGS', settings)
      this.$store.commit('SET_TOOLBOX_VISIBILITY', true)
    },
    hideToolbox () {
    }
  },
  mounted () {
    setTimeout(() => {
      // TODO: Editor needs to be created AFTER the toolboxContainer is ready
      // because it looks for all .ui-droppable elements to apply d-n-d ops to.
      // maybe create an action for this that is called in mounted() of ToolboxContainer?
      this.canvas = new Editor(this.document.id.toString())

      this.canvas.on('toolbox', this.onToolbox)
      this.canvas.on('select', () => this.onCanvasUpdate(this.canvas))
      this.canvas.on('deselect', () => this.onCanvasUpdate(this.canvas))
      this.canvas.on('commandStackChanged', () => this.onCanvasUpdate(this.canvas))
      this.canvas.on('zoomed', (editor, { value }) => {
        this.$store.commit('SET_ZOOM_FACTOR', value)
      })
      this.canvas.load(this.document.data)
    })
  }
}
</script>

<style>
.oscilloscope-inner {
  background-color: #1C1D24;
  height: 100%;
  box-sizing: border-box;
}
</style>