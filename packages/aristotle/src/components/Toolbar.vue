<template>
  <div>
    <button
      :disabled="!editor.canUndo"
      @click="relayCommand('UNDO')">
      Undo
    </button>
    <button
      :disabled="!editor.canRedo"
      @click="relayCommand('REDO')">
      Redo
    </button>
  </div>
</template>

<script>
import DocumentModel from '@/models/DocumentModel'

export default {
  name: 'Toolbar',
  props: {
    document: {
      type: DocumentModel,
      required: true
    }
  },
  computed: {
    editor () {
      console.log('this.document: ', this.document.editorModel)
      return this.document.editorModel
    }
  },
  methods: {
    relayCommand (command, payload) {
      return this.$emit('relayCommand', { command, payload })
    }
  }
}
</script>
