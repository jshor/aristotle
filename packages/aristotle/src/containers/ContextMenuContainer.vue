<template>
  <overlay
    v-if="contextMenu.show"
    @click="hideMenu"
    @contextmenu="updateMenuCoordinates">
    <context-menu
      :position="contextMenu.position"
      :items="menuItems"
      @action="action"
    />
  </overlay>
  <div v-else />
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import ContextMenu from '../components/ContextMenu'
import Overlay from '../components/Overlay'

export default {
  name: 'ContextMenuContainer',
  components: {
    ContextMenu,
    Overlay
  },
  computed: {
    ...mapState(['contextMenu']),
    ...mapGetters(['activeDocument']),
    menuItems () {
      const { editorModel } = this.activeDocument

      return [
        {

          label: 'Cut',
          hotkey: 'X',
          action: 'CUT',
          enabled: editorModel.hasSelectedElements
        },
        {

          label: 'Copy',
          hotkey: 'C',
          action: 'COPY',
          enabled: editorModel.hasSelectedElements
        },
        {

          label: 'Paste',
          hotkey: 'V',
          action: 'PASTE',
          enabled: true // TODO: not always enabled
        },
        {

          label: 'Delete',
          action: 'DELETE',
          enabled: editorModel.hasSelectedElements
        },
        {
          type: 'separator'
        },
        {

          label: 'Select All',
          hotkey: 'A',
          action: 'SELECT_ALL',
          enabled: true
        }
      ]
    }
  },
  methods: {
    hideMenu () {
      console.log('received event')
      this.$store.commit('SET_CONTEXT_MENU', false)
    },
    updateMenuCoordinates () {
      this.$store.commit('SET_CONTEXT_MENU', {
        x: event.x,
        y: event.y
      })
      event.stopPropagation()
      event.preventDefault()
    },
    action (actionName) {
      this.$store.commit('RELAY_COMMAND', {
        command: actionName,
        payload: null,
        documentId: this.activeDocument.id
      })
      this.hideMenu()
    }
  }
}
</script>
