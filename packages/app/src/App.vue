<template>
  <div
    v-if="hasOpenDocuments"
    class="app"
  >
    <div
      class="app__dropzone"
      :class="{
        'app__dropzone--active': isDropping
      }"
    />
    <div class="app__toolbar">
      <toolbar
        v-if="activeDocumentId && activeDocument"
        :key="activeDocumentId"
        :store="activeDocument.store"
      />
    </div>
    <div class="app__bottom">
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

    <div class="app__status">
    </div>
  </div>

  <div v-else>
    <div
      class="app__dropzone"
      :class="{
        'app__dropzone--active': isDropping
      }"
    />
    no documents open {{ isDropping }}
  </div>
</template>

<script lang="ts">
/// <reference path="./types/index.d.ts" />
import { storeToRefs } from 'pinia'
import { defineComponent, onBeforeUnmount, onMounted, watchEffect, ref } from 'vue'
import Document from './containers/Document.vue'
import Toolbar from './containers/Toolbar.vue'
import Toolbox from './containers/Toolbox.vue'
import ResizablePanes from '@/components/ResizablePanes.vue'
import { useRootStore } from './store/root'
import TabItem from './components/tab/TabItem.vue'
import TabHost from './components/tab/TabHost.vue'
import Oscilloscope from './containers/Oscilloscope.vue'
// import RemoteService from './services/RemoteService'
import createApplicationMenu from './menus'

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

    let isDropping = ref(false)

    if (!hasOpenDocuments.value) {
      store.openTestDocuments()
    }

    // update the app menu when any of the store variables it depends on to show/hide menu items change
    watchEffect(() => window.api.setApplicationMenu(createApplicationMenu(store)))

    watchEffect(() => {
      document.title = store.activeDocument
        ? `${store.activeDocument.displayName} - Aristotle`
        : 'Aristotle'
    })

    window.api.onBeforeClose(store.closeAll)
    window.api.onOpenFile(store.openDocumentFromPath)

    onMounted(() => {
      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('dragover', onDragOver)
      document.addEventListener('dragleave', onDragLeave)
      document.addEventListener('drop', onDrop)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('drop', onDrop)
    })

    function onDragOver ($event: DragEvent) {
      $event.stopPropagation()
      $event.preventDefault()

      if ($event.dataTransfer) {
        $event.dataTransfer.dropEffect = 'copy'
      }

      isDropping.value = true
    }

    async function onDrop ($event: DragEvent) {
      $event.stopPropagation()
      $event.preventDefault()

      const files = $event.dataTransfer?.files

      if (files) {
        for (let i = 0; i < files.length; i++) {
          await store.openDocumentFromPath(files[i].path)
        }
      }

      isDropping.value = false
    }

    function onDragLeave () {
      isDropping.value = false
    }

    function onKeyDown ($event: KeyboardEvent) {
      if ($event.ctrlKey && $event.key.toUpperCase() === 'R') {
        // refresh command
        // TODO: in development only, this will refresh the page; otherwise, reset active circuit
        // RemoteService.canCloseWindow = true
        window.location.reload()
      }
    }

    return {
      activeDocument,
      activeDocumentId,
      documents,
      hasOpenDocuments,
      isDropping,
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
$toolbar-height: 50px;
$status-bar-height: 25px;

.app {
  width: 100vw;
  height: 100vh;
  max-width: 100vw;
  max-height: 100vh;
  display: flex;
  flex-direction: column;

  &__dropzone {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: $color-bg-primary;
    opacity: 0;
    z-index: 10;
    transition: 0.25s opacity;
    pointer-events: none;

    &--active {
      opacity: 0.5;
    }
  }

  &__toolbar {
    width: 100%;
    height: $toolbar-height;
  }

  &__bottom {
    max-height: calc(100% - $toolbar-height - $status-bar-height);
    flex: 1;
    display: flex;
  }

  &__status {
    background: green;
    height: $status-bar-height;
  }
}
</style>
