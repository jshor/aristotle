<template>
  <div id="app" class="main">
    <button @click="openDocument" v-if="!activeDocument">Open document</button>
    <toolbar 
      v-if="activeDocument"
      :document="activeDocument"
      @relayCommand="onRelayCommand"
      @openDocument="openDocument"
    />
    
    <div class="panel">
      <toolbox-container class="dropbox" />
      <div class="document-host">
        <tabs-container />

        <DocumentContainer
          v-show="document.id === activeDocumentId"
          v-for="document in documents"
          :document="document"
          :key="document.id"
          class="editor"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Toolbar from '@/components/Toolbar'
import DocumentContainer from '@/containers/DocumentContainer'
import TabsContainer from '@/containers/TabsContainer'
import ToolboxContainer from '@/containers/ToolboxContainer'
import DocumentModel from '@/models/DocumentModel'
import { CommandModel } from '@aristotle/editor'
import data from '@/mocks/document.json'

export default {
  name: 'App',
  components: {
    DocumentContainer,
    TabsContainer,
    ToolboxContainer,
    Toolbar
  },
  computed: {
    ...mapState({
      documents: (state) => state.documents,
      activeDocumentId: (state) => state.activeDocumentId
    }),
    ...mapGetters(['activeDocument'])
  },
  methods: {
    onRelayCommand ({ command, payload }) {
      this.$store.commit('RELAY_COMMAND', new CommandModel(command, payload))
    },
    openDocument () {
      console.log('opening doc')
      const document = new DocumentModel()

      document.data = data

      this.$store.commit('OPEN_DOCUMENT', document)
    },
    changeDocument () {

    }
  }
}
</script>

<style lang="scss">
$fa-font-path: '~@fortawesome/fontawesome-free/webfonts';
@import '~@fortawesome/fontawesome-free/scss/fontawesome';
@import '"~@fortawesome/fontawesome-free/scss/solid';

$color-shadow: #000;

$border-width: 1px;
$scrollbar-width: 3px;
body {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  margin: 0;
  background: #1D1E25;
  font-family: Segoe UI;
  font-size: 0.8rem;
}

rect.draw2d {
  &_ResizeHandle {
    // display: none;
  }

  &_shape_basic_Rectangle:not(:last-of-type) {
    // stroke: none;
  }
}

.main {
  display: flex;
  height: 100vh;
  width: 100vw;
  max-width: 100vw;
  max-height: 100vh;
  flex-direction: column;
}

.panel {
  display: flex;
  height: 100vh;
  width: 100vw;
  max-width: 100vw;
  max-height: 100vh;
  flex-direction: row;
}

.dropbox {
  width: 200px;
}

.document-host {
  flex: 1;
  height: 100%;
  max-width: calc(100vw - 200px);
  display: flex;          /* NEW */
  flex-direction: column; /* NEW */
  padding: 0.5rem;
  box-sizing: border-box;
}

.editor {
  overflow: hidden;
  
  background-color: #333641;
  box-sizing: border-box;
  border: 3px solid #3D404B;
  border-top: 0;
  box-shadow: 0 0 $border-width $color-shadow;
}
</style>
