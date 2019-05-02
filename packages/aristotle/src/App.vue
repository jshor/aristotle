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

    {{ filters }}
    <img :src="filters" />
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
 position: fixed;
  --main-bg-color: brown;
  overflow: hidden;
}

rect.draw2d_shape_icon_Wrench2 {
  cursor: pointer;
}

path.draw2d_shape_icon_Wrench2 {
  fill: #ffffff;
  stroke: #333641;
  stroke-width: 1px;
}

image.draw2d_shape_basic_Image {
  opacity: 1 !important; // SHAME.
  cursor: move !important;
}

ellipse.draw2d_OutputPort, ellipse.draw2d_InputPort {
    fill: rgb(255,255,255) !important; // SHAME.
    stroke-width: 2;
}

rect.draw2d {
  &_ResizeHandle {
    display: none;
  }

  &_shape_basic_Rectangle:not(:last-of-type) {
    // stroke: none;
    stroke-dasharray: 6;
    animation: animate1 30s infinite linear; // THIS IS COOL!
    opacity: 0.5;
    stroke: #5c6175;
  }
}

.draw2d_Connection {
  // stroke-dasharray: 6;
  // animation: animate1 30s infinite linear; // THIS IS COOL!
  stroke-linejoin: bevel;
  stroke-linecap: square !important;
  cursor: pointer;
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
