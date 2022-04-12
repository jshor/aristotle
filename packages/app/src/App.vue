<template>
  <div
    v-if="hasOpenDocuments"
    class="app"
  >
    <div class="app__toolbar">
      <toolbar
        v-if="activeDocumentId && activeDocument"
        :key="activeDocumentId"
        :store="activeDocument.store"
      />
    </div>
    <div
      class="app__bottom"
      ref="bottom"
    >
      <resizable-panes v-model="toolboxWidth">
        <template v-slot:first>
          toolbox {{ toolboxWidth }}% wide
        </template>
        <template v-slot:second>
          <resizable-panes
            v-model="documentHeight"
            :is-vertical="true"
          >
            <template v-slot:first>
              <tab-host>
                <template v-slot:tabs>
                  <tab-item
                    v-for="(document, id) in documents"
                    :key="id"
                    :label="document.fileName"
                    :active="activeDocumentId === id"
                    @activate="activateDocument(id.toString())"
                    @close="closeDocument(id.toString())"
                  />
                </template>
                <template v-slot:default>
                  <document
                    v-if="activeDocumentId && activeDocument"
                    :key="activeDocumentId"
                    :store="activeDocument.store"
                  />
                </template>
              </tab-host>
            </template>
            <template v-slot:second>
              <oscilloscope
                v-if="activeDocumentId && activeDocument"
                :key="activeDocumentId"
                :store="activeDocument.store"
              />
            </template>
          </resizable-panes>
        </template>
      </resizable-panes>
    </div>
  </div>

  <div v-else>
    no documents open
  </div>
</template>

<script lang="ts">
/// <reference path="./types/index.d.ts" />
import { storeToRefs } from 'pinia'
import { defineComponent } from 'vue'
import Document from './containers/Document.vue'
import Toolbar from './containers/Toolbar.vue'
import ResizablePanes from '@/components/ResizablePanes.vue'
import { useRootStore } from './store/root'
import TabItem from './components/tab/TabItem.vue'
import TabHost from './components/tab/TabHost.vue'
import Oscilloscope from './containers/Oscilloscope.vue'

export default defineComponent({
  name: 'App',
  components: {
    Document,
    ResizablePanes,
    Toolbar,
    TabItem,
    TabHost,
    Oscilloscope
},
  setup () {
    const store = useRootStore()
    const {
      activeDocument,
      activeDocumentId,
      documents,
      hasOpenDocuments
    } = storeToRefs(store)

    if (!hasOpenDocuments.value) {
      store.openTestDocuments()
    }

    return {
      activeDocument,
      activeDocumentId,
      documents,
      hasOpenDocuments,
      activateDocument: store.activateDocument,
      closeDocument: store.closeDocument
    }
  },
  data () {
    return {
      horizontal: false,
      isMouseDown: false,
      lastPosition: 0,
      toolboxWidth: 20,
      documentHeight: 80
    }
  }
})
</script>

<style lang="scss">
body {
  padding: 0;
  margin: 0;
  user-select: none;
  font-family: system-ui;
  min-height: 100vh;
  max-height: 100vh;
}

.app {
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  display: flex;
  flex-direction: column;

  &__toolbar {
    width: 100%;
    height: 50px;
  }

  &__bottom {
    max-height: calc(100% - 50px);
    flex: 1;
    display: flex;
  }
}
</style>
