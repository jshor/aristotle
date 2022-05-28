<template>
  <div
    class="app__dropzone"
    :class="{
      'app__dropzone--active': isDropping
    }"
  />

  <main-view v-if="activeDocumentId && activeDocument">
    <template #top>
      <div v-if="isMobile">mobile bar</div>
      <toolbar
        :key="activeDocumentId"
        :store="activeDocument.store"
      />
      <toolbox :store="activeDocument.store" />
    </template>

    <template #middle>
      <tab-host>
        <template v-if="!isMobile" #tabs>
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
        <template #default>
          <document
            :key="activeDocumentId"
            :store="activeDocument.store"
            @switch="switchDocument"
            @open-integrated-circuit="openIntegratedCircuit"
          />
        </template>
      </tab-host>
    </template>

    <template #bottom>
      <oscilloscope
        :key="activeDocumentId"
        :store="activeDocument.store"
      />

      <status-bar
        v-if="!isMobile"
        :key="activeDocumentId"
        :store="activeDocument.store"
        :is-fullscreen="isFullscreen"
        @fullscreen="toggleFullscreen"
      />
    </template>
  </main-view>

  <div v-else>
    no documents open {{ isDropping }}
  </div>

</template>

<script lang="ts">
// TODO: the document/toolbox/toolbar stuff should be moved into a separate view called "Workspace.vue"
/// <reference path="./types/index.d.ts" />
import { storeToRefs } from 'pinia'
import { defineComponent, onBeforeUnmount, onMounted, watchEffect, ref } from 'vue'
import Document from './containers/Document.vue'
import Toolbar from './containers/Toolbar.vue'
import Toolbox from './containers/Toolbox.vue'
import { useRootStore } from './store/root'
import TabItem from './components/tab/TabItem.vue'
import TabHost from './components/tab/TabHost.vue'
import Oscilloscope from './containers/Oscilloscope.vue'
import StatusBar from './containers/StatusBar.vue'
// import RemoteService from './services/RemoteService'
import createApplicationMenu from './menus'
import MainView from './components/layout/MainView.vue'
import isMobile from '@/utils/isMobile'

export default defineComponent({
  name: 'App',
  components: {
    Document,
    Toolbar,
    TabItem,
    TabHost,
    Toolbox,
    Oscilloscope,
    StatusBar,
    MainView
},
  setup () {
    const store = useRootStore()
    const {
      activeDocument,
      activeDocumentId,
      documents,
      hasOpenDocuments,
      isFullscreen
    } = storeToRefs(store)

    let isDropping = ref(false)

    if (!hasOpenDocuments.value) {
      store.openTestDocuments()
    }

    // update the app menu when any of the store variables it depends on to show/hide menu items change
    watchEffect(() => window.api.setApplicationMenu(createApplicationMenu()))

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
      isFullscreen,
      toggleFullscreen: store.toggleFullscreen,
      activateDocument: store.activateDocument,
      closeDocument: store.closeDocument,
      switchDocument: store.switchDocument,
      openIntegratedCircuit: store.openIntegratedCircuit
    }
  },
  data () {
    return {
      horizontal: false,
      lastPosition: 0,
      toolboxWidth: 20,
      oscilloscopeHeight: 80,
      isMobile
    }
  }
})
</script>

<style lang="scss">
.app {
  &__dropzone {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-bg-primary);
    opacity: 0;
    z-index: 10;
    transition: 0.25s opacity;
    pointer-events: none;

    &--active {
      opacity: 0.5;
    }
  }
}
</style>
