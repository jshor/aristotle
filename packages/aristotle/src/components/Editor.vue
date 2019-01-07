<template>
  <div id="app">
    <button @click="pan">Panning Mode</button>
    <button @click="select">Select Mode</button>
    <button @click="step">Step</button>
    <div id="canvasWrapper">
      <div
        id="canvas"
        :style="{
          width: '4998px',
          height: '4998px'
        }"
      />
    </div>
  </div>
</template>

<script>
import Editor from '@/designer/Editor'
import CommandModel from '@/models/CommandModel'
import SerializationService from '@/services/SerializationService'

export default {
  name: 'Editor',
  props: {
    data: {
      type: String,
      default: ''
    },
    relayedCommand: {
      type: CommandModel,
      default: null
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
      console.log('this: ', value)
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
      const model = canvas.getEditorModel()

      this.$store.commit('SET_EDITOR_MODEL', model)
      // console.log('model: ', model)
    }
  },
  mounted () {
    this.canvas = new Editor('canvas')

    this.canvas.on('select', () => this.onCanvasUpdate(this.canvas))
    this.canvas.on('commandStackChanged', () => this.onCanvasUpdate(this.canvas))

    SerializationService.deserialize(this.canvas)

  }
}
</script>

<style lang="scss" src="./styles/Editor.scss"></style>
