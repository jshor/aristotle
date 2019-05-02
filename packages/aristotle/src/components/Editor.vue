<template>
  <div id="canvasWrapper">
    <div
      :id="document.id"
      :style="{
        width: '4998px',
        height: '4998px'
      }"
    />
  </div>
</template>

<script>
// TODO: THIS COMPONENT IS DEAD
import { Editor, CommandModel } from '@aristotle/editor'
import DocumentModel from '@/models/DocumentModel'

export default {
  name: 'Editor',
  props: {
    data: {
      type: String,
      default: ''
    },
    // relayedCommand: {
    //   type: CommandModel,
    //   default: null
    // },
    document: {
      type: DocumentModel,
      require: true
    }
  },
  data () {
    return {
      canvas: null,
      canvasWidth: 1600,
      canvasHeight: 1600
    }
  },
  watch: {
    data (value) {
    },
    relayedCommand: {
      deep: true,
      handler (command) {
        this.canvas.applyCommand(command)
      }
    }
  },
  methods: {
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
    this.canvas = new Editor(this.document.id.toString())

    this.canvas.on('toolbox', this.onToolbox)
    this.canvas.on('select', () => this.onCanvasUpdate(this.canvas))
    this.canvas.on('deselect', () => this.onCanvasUpdate(this.canvas))
    this.canvas.on('commandStackChanged', () => this.onCanvasUpdate(this.canvas))
    this.canvas.load(this.document.data)
  }
}
</script>

<style lang="scss" src="./styles/Editor.scss"></style>
