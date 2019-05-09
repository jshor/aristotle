<template>
  <div id="app" class="main">
    <button @click="openDocument" v-if="!activeDocument">Open document</button>
    <toolbar
      v-if="activeDocument"
      :document="activeDocument"
      @relayCommand="onRelayCommand"
      @openDocument="openDocument"
    />

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
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Toolbar from '@/components/Toolbar'
import DocumentContainer from '@/containers/DocumentContainer'
import TabsContainer from '@/containers/TabsContainer'
import ToolboxContainer from '@/containers/ToolboxContainer'
import DocumentModel from '@/models/DocumentModel'
import { CommandModel } from '@aristotle/editor'
import data from '@/mocks/document2.json'
import filters from '@/assets/filters.svg'

export default {
  name: 'App',
  components: {
    DocumentContainer,
    TabsContainer,
    ToolboxContainer,
    Toolbar
  },
  data () {
    return { filters }
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
  user-select: none;
  margin: 0;
  background: #1D1E25;
  font-family: Segoe UI;
  font-size: 0.8rem;
  position: fixed;
  overflow: hidden;
}

@keyframes animate1 {
 to {
    stroke-dashoffset: -1000;
 }
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
