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
    <button
      @click="relayCommand('CUT')">
      Cut
    </button>
    <button
      @click="relayCommand('PASTE')">
      Paste
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
