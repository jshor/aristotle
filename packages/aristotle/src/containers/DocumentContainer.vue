<template>
  <div>
    <Toolbar
      :document="activeDocument"
      @relayCommand="onRelayCommand"
    />
    <Editor
      :document="activeDocument"
      :relayedCommand="relayedCommand"
      @updateEditor="onUpdateEditor"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Editor from '@/components/Editor'
import Toolbar from '@/components/Toolbar'
import DocumentModel from '@/models/DocumentModel'
import EditorModel from '@/models/EditorModel'
import CommandModel from '@/models/CommandModel'
import { State } from '../store'

export default {
  name: 'DocumentContainer',
  components: {
    Editor,
    Toolbar
  },
  computed: {
    ...mapGetters(['activeDocument']),
    ...mapState({
      relayedCommand: (state) => state.documents.relayedCommand
    })
  },
  methods: {
    onRelayCommand ({ command, payload }) {
      this.$store.commit('RELAY_COMMAND', new CommandModel(command, payload))
    },
    onUpdateEditor (editorModel) {
      this.$store.commit('SET_EDITOR_MODEL', editorModel)
    }
  }
}
</script>
