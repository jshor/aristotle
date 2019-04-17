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
    <Toolbox
      v-if="toolboxVisible"
      :settings="toolboxSettings"
      @change="toolboxChanged"
      @close="closeToolbox"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Editor from '@/components/Editor'
import Toolbar from '@/components/Toolbar'
import Toolbox from '@/components/Toolbox'
import { CommandModel } from '@aristotle/editor'

export default {
  name: 'DocumentContainer',
  components: {
    Editor,
    Toolbar,
    Toolbox
  },
  computed: {
    ...mapGetters(['activeDocument']),
    ...mapState({
      relayedCommand: (state) => state.documents.relayedCommand,
      toolboxVisible: state => state.documents.toolboxVisible,
      toolboxSettings: state => state.documents.toolboxSettings
    })
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
    }
  }
}
</script>
