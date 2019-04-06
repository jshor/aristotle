<template>
  <div id="app">
    <div>
      <img :src="buffer" class="draw2d_droppable ui-draggable" ref="svg" />
      Nor
    </div>
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
import { renderGate } from '@aristotle/logic-gates'
import data from '@/services/data.json'

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
      canvasHeight: 1600,
      buffer: renderGate('NOR', 2, '#000').path
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
    this.canvas = new Editor('canvas')
    // this.draggable = new DraggableService(this.canvas)
    // this.draggable.addElement(this.$refs.svg)

    this.canvas.on('toolbox', this.onToolbox)
    this.canvas.on('select', () => this.onCanvasUpdate(this.canvas))
    this.canvas.on('deselect', () => this.onCanvasUpdate(this.canvas))
    this.canvas.on('commandStackChanged', () => this.onCanvasUpdate(this.canvas))

    SerializationService.deserialize(this.canvas, data)

  }
}
</script>

<style lang="scss" src="./styles/Editor.scss"></style>
