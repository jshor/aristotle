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
      <properties
        v-if="elementSettings && toolboxOpen"
        :settings="elementSettings"
        @change="toolboxChanged"
        @close="propertiesClosed"
      />
    </template>

    <template v-slot:oscilloscope>
      <oscilloscope-container :waves="waves" />
    </template>

  </document>
</template>

<script>
import { mapState } from 'vuex'
import Document from '@/components/Document'
import Properties from '@/components/Properties'
import OscilloscopeContainer from './OscilloscopeContainer'
import { Editor, CommandModel } from '@aristotle/editor'
import DocumentModel from '@/models/DocumentModel'

export default {
  name: 'DocumentContainer',
  components: {
    Document,
    Properties,
    OscilloscopeContainer
  },
  data () {
    return {
      canvas: null,
      waves: {},
      toolboxOpen: false,
      elementSettings: null,
      isActive: true
    }
  },
  props: {
    document: {
      type: Object,
      required: true
    }
  },
  computed: {
    ...mapState([
      'relayedCommand',
      'activeDocumentId'
    ])
  },
  watch: {
    relayedCommand: {
      deep: true,
      handler (command) {
        this.canvas.applyCommand(command)
      }
    },
    activeDocumentId: {
      handler (documentId) {
        this.isActive = documentId === this.document.id
        this.setDocumentActive()
      }
    }
  },
  methods: {
    setDocumentActive () {
      if (this.isActive && document.hasFocus()) {
        this.canvas.oscillation.start()
      } else { 
        this.canvas.oscillation.stop()
      }
    },
    onRelayCommand ({ command, payload }) {
      this.$store.commit('RELAY_COMMAND', new CommandModel(command, payload))
    },
    onUpdateEditor (editorModel) {
      this.$store.commit('SET_EDITOR_MODEL', editorModel)
    },
    toolboxChanged (payload) {
      this.onRelayCommand({ command: 'UPDATE_ELEMENT', payload })
    },
    openSettingsDialog (editor, settings) {
      this.elementSettings = settings
      this.toolboxOpen = true
    },
    propertiesClosed () {
      this.toolboxOpen = false
    },
    onCanvasUpdate (canvas) {
      const model = canvas.getEditorModel() // should be v-model (emit `value`)

      this.$store.commit('SET_EDITOR_MODEL', model)
      this.toolboxOpen = false
    }
  },
  mounted () {
    setTimeout(() => {
      // TODO: Editor needs to be created AFTER the toolboxContainer is ready
      // because it looks for all .ui-droppable elements to apply d-n-d ops to.
      // maybe create an action for this that is called in mounted() of ToolboxContainer?
      this.canvas = new Editor(this.document.id.toString())

      this.canvas.on('toolbox.open', this.openSettingsDialog)
      this.canvas.on('toolbox.close', this.propertiesClosed)
      this.canvas.on('select', () => this.onCanvasUpdate(this.canvas))
      this.canvas.on('deselect', () => this.onCanvasUpdate(this.canvas))
      this.canvas.on('commandStackChanged', () => this.onCanvasUpdate(this.canvas))
      this.canvas.on('zoomed', (editor, { value }) => {
        this.$store.commit('SET_ZOOM_FACTOR', value)
      })
      this.canvas.on('oscillate', (editor, waves) => {
        this.waves = waves
      })
      this.canvas.load(this.document.data)

      setInterval(() => this.setDocumentActive(), 300)
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
