<template>
  <document :oscilloscope-enabled="document.editorModel.oscilloscopeEnabled" >
    <template v-slot:editor>
      <div
        :id="document.id"
        :style="{
          width: '4998px',
          height: '4998px'
        }"
        ref="editor"
      />
      <properties
        v-if="elementSettings && toolboxOpen"
        :settings="elementSettings"
        @change="toolboxChanged"
        @close="propertiesClosed"
      />
      <div class="zoom">
        <button
          class="zoom__out"
          :disabled="false"
          @click="zoom(1)">
          <i class="fas fa-search-minus" />
        </button>
        <div class="zoom__level">{{ zoomLevel }}</div>
        <button
          class="zoom__out"
          @click="zoom(-1)">
          <i class="fas fa-search-plus" />
        </button>
      </div>
    </template>

    <template v-slot:oscilloscope>
      <oscilloscope-container :waves="waves" />
    </template>

  </document>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Document from '@/components/Document'
import Properties from '@/components/Properties'
import OscilloscopeContainer from './OscilloscopeContainer'
import { Editor, CommandModel } from '@aristotle/editor'

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
      isActive: true,
      focused: true
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
    ]),
    zoomLevel () {
      return this.document.editorModel.zoomLevel
    }
  },
  watch: {
    relayedCommand: {
      deep: true,
      handler (payload) {
        if (payload.documentId === this.document.id) {
          this.canvas.applyCommand(payload)
        }
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
      const focused = this.isActive && document.hasFocus()

      if (!this.canvas.debugMode) {
        if (!focused) {
          this.canvas.oscillation.stop()
        } else {
          this.canvas.oscillation.start()
        }
      }
    },
    onRelayCommand ({ command, payload }) {
      this.$store.commit('RELAY_COMMAND', {
        command,
        payload,
        documentId: this.document.id
      })
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
    },
    zoom (factor) {
      const minZoom = 0.5
      const maxZoom = 5
      const increment = 0.25
      const l = this.zoomLevel + (factor * increment)

      this.onRelayCommand({
        command: 'SET_ZOOM',
        payload: factor
      })
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
      this.canvas.on('zoomed', () => this.onCanvasUpdate(this.canvas))
      this.canvas.on('oscillate', (editor, waves) => {
        this.waves = waves
      })
      this.canvas.load(this.document.data)

      setInterval(() => this.setDocumentActive(), 300)
    })
  }
}
</script>

<style lang="scss">
.oscilloscope-inner {
  background-color: #1C1D24;
  height: 100%;
  box-sizing: border-box;
}

.zoom {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: $color-bg-primary;
  border-radius: 2px;
  color: $color-primary;
  display: flex;
  box-sizing: border-box;
  border: 1px solid $color-bg-tertiary;

  &__in, &__out, &__level {
    padding: 0.25rem;
  }

  &__level {
    border-style: solid;
    border-color: $color-bg-tertiary;
    border-width: 0 1px;
    width: 2rem;
  }

  &__in, &__out {
    border: 0;
    outline: none;
    background-color: transparent;
    color: $color-primary;

    &:not(:disabled) {
      cursor: pointer;
    }

    &:hover:not(:disabled) {
      background-color: $color-bg-secondary;
    }

    &:active:not(:disabled) {
      background-color: $color-bg-tertiary;
    }

    &:disabled {
      color: $color-bg-secondary;
    }
  }
}
</style>
