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
          <toolbox v-if="activeDocument" :store="activeDocument.store" />
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
                    :label="document.displayName"
                    :active="activeDocumentId === id"
                    :dirty="document.store().isDirty"
                    @activate="activateDocument(id.toString())"
                    @close="closeDocument(id.toString())"
                  />
                </template>
                <template v-slot:default>
                  <document
                    v-if="activeDocumentId && activeDocument"
                    :key="activeDocumentId"
                    :store="activeDocument.store"
                    @switch="switchDocument"
                    @open-integrated-circuit="openIntegratedCircuit"
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
import { defineComponent, onBeforeUnmount, onMounted, watchEffect } from 'vue'
import Document from './containers/Document.vue'
import Toolbar from './containers/Toolbar.vue'
import Toolbox from './containers/Toolbox.vue'
import ResizablePanes from '@/components/ResizablePanes.vue'
import { useRootStore } from './store/root'
import TabItem from './components/tab/TabItem.vue'
import TabHost from './components/tab/TabHost.vue'
import Oscilloscope from './containers/Oscilloscope.vue'
import RemoteService from './services/RemoteService'

export default defineComponent({
  name: 'App',
  components: {
    Document,
    ResizablePanes,
    Toolbar,
    TabItem,
    TabHost,
    Toolbox,
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

    // update the app menu when any of the store variables it depends on to show/hide menu items change
    watchEffect(() => RemoteService.setApplicationMenu(store))

    watchEffect(() => {
      document.title = store.activeDocument
        ? `${store.activeDocument.displayName} - Aristotle`
        : 'Aristotle'
    })

    onMounted(() => {
      document.addEventListener('keydown', onKeyDown)
      RemoteService.on('close', store.closeApplication)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeyDown)
      // RemoteService.off('close', store.closeApplication) // TODO
    })

    function onKeyDown ($event: KeyboardEvent) {
      if ($event.ctrlKey && $event.key === 'Tab') {
        store.switchDocument($event.shiftKey ? -1 : 1)
        $event.preventDefault()
      }

      if ($event.ctrlKey && $event.key.toUpperCase() === 'R') {
        // refresh command
        // TODO: in development only, this will refresh the page; otherwise, reset active circuit
        RemoteService.canCloseWindow = true
      }

      if ($event.ctrlKey && $event.key.toUpperCase() === 'Q') {
        store.closeApplication()
      }

      if ($event.ctrlKey && $event.key.toUpperCase() === 'W') {
        if (store.activeDocumentId) {
          store.closeDocument(store.activeDocumentId)
          $event.preventDefault()
        }
      }
    }

    return {
      activeDocument,
      activeDocumentId,
      documents,
      hasOpenDocuments,
      activateDocument: store.activateDocument,
      closeDocument: store.closeDocument,
      switchDocument: store.switchDocument,
      openIntegratedCircuit: store.openIntegratedCircuit
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
