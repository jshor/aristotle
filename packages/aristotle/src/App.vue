<template>
  <div id="app" class="main">
    <div class="toolbar">
      <button @click="changeDocument">changeDocument</button>
      <button @click="openDocument">Open Document</button>
      <toolbar 
        v-if="activeDocument"
        :document="activeDocument"
        @relayCommand="onRelayCommand"
      />
    </div>
    
    <div class="panel">
      <toolbox-container class="dropbox" />
      <div class="document-host">
        <div class="tab-host">
          <span
            v-for="document in documents"
            :key="document.id"
            @click="activateDocument(document.id)">
            {{ document.id }} &mdash;
          </span>
        </div>

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
import ToolboxContainer from '@/containers/ToolboxContainer'
import DocumentModel from '@/models/DocumentModel'
import { CommandModel } from '@aristotle/editor'
import data from '@/mocks/document2.json'

export default {
  name: 'App',
  components: {
    DocumentContainer,
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
    activateDocument (documentId) {
      this.$store.commit('ACTIVATE_DOCUMENT', documentId)
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
body {
  -webkit-user-select: none;
  -moz-user-select: none;
  user-select: none;
  margin: 0;
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

.toolbar {
  background-color: beige;
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
  background: lightblue;
  width: 200px;
}

.document-host {
  flex: 1;
  height: 100%;
  max-width: calc(100vw - 200px);
  display: flex;          /* NEW */
  flex-direction: column; /* NEW */
}

.editor {
  overflow: hidden;
}
</style>
