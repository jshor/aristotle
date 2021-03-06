<template>
  <div id="app" class="main" v-if="activeDocument">
    <circuit-export-container v-if="dialog.type === 'INTEGRATED_CIRCUIT'" />

    <div class="content" :class="{ 'content--glass': dialog.open }">
      <toolbar-container :document="activeDocument" />

      <split-pane :default-percent="20" split="vertical">
        <template v-slot:paneL>
          <toolbox-container class="dropbox" />
        </template>
        <template v-slot:paneR>
          <div class="miracle">
            <tabs-container />

            <DocumentContainer
              v-show="document.id === activeDocumentId"
              v-for="document in documents"
              :document="document"
              :key="document.id"
              class="document"
            />

          </div>
        </template>
      </split-pane>
    </div>
  </div>

  <div class="app--no-doc" v-else>
    <splash
      @open="openDocument"
      @new="newDocument"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Splash from '@/components/Splash'
import Toolbar from '@/containers/ToolbarContainer'
import CircuitExportContainer from '@/containers/CircuitExportContainer'
import DocumentContainer from '@/containers/DocumentContainer'
import TabsContainer from '@/containers/TabsContainer'
import ToolbarContainer from '@/containers/ToolbarContainer'
import ToolboxContainer from '@/containers/ToolboxContainer'
import DocumentModel from '@/models/DocumentModel'
import data from '@/mocks/document.json'
import filters from '@/assets/filters.svg'

export default {
  name: 'App',
  components: {
    CircuitExportContainer,
    DocumentContainer,
    Splash,
    TabsContainer,
    ToolbarContainer,
    ToolboxContainer
  },
  data () {
    return { filters }
  },
  computed: {
    ...mapState(['documents', 'activeDocumentId', 'dialog']),
    ...mapGetters(['activeDocument'])
  },
  methods: {
    relayCommand (payload) {
      console.log('will relay: ', payload)
      this.$store.commit('RELAY_COMMAND', payload)
    },
    openDocument () {
      const document = new DocumentModel()

      document.data = data
      this.$store.commit('OPEN_DOCUMENT', document)
    },
    newDocument () {
      const document = new DocumentModel()

      this.$store.commit('OPEN_DOCUMENT', document)
    },
    changeDocument () {

    }
  }
}
</script>

<style lang="scss">
body {
  user-select: none;
  margin: 0;
  background: #1D1E25;
  font-family: Segoe UI, "Open Sans";
  font-size: 0.8rem;
  position: fixed;
  overflow: hidden;
}

@keyframes animate1 {
 to {
    stroke-dashoffset: -1000;
 }
}

.app--no-doc {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
}

.main {
  display: flex;
  height: 100vh;
  width: 100vw;
  max-width: 100vw;
  max-height: 100vh;
  flex-direction: column;
  overflow: hidden;
  // opacity: 0.5;
  // filter: blur(10px); // thanks CSS, very cool!
}

.content {
  display: flex;
  flex-direction: column;
  flex: 1;
  filter: blur(0);
  transition: 0.5s filter;
}
.content--glass {
  // opacity: 0.5;
  filter: blur(3px);
}

.miracle {
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 10px 10px 5px 5px;
}

.document {
  overflow: hidden;
  height: 100%;
  padding-bottom: 5px;
}

.dropbox {
  padding: 10px 5px 10px 7px;
}
</style>
