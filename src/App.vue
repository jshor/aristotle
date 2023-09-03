<template>
  <theme :dark="experience.darkMode.value">
    <div
      class="app__dropzone"
      :class="{
        'app__dropzone--active': isDropping
      }"
    />

    <main-view
      v-if="activeDocumentId && activeDocument"
      :is-blurred="isDialogOpen"
      @contextmenu="onContextMenu">
      <template #top>
        <!-- mobile-only header -->
        <template v-if="isMobile">
          <mobile-header
            @select="isDocumentSelectOpen = true"
            @open="isSettingsOpen = true"
            :document-name="activeDocument.displayName"
            :document-count="3"
          />

          <mobile-pullout v-model="isSettingsOpen">
            <mobile-pullout-heading @close="isSettingsOpen = false" />
            <mobile-preferences />
          </mobile-pullout>

          <mobile-popout-menu v-model="isDocumentSelectOpen">
            <mobile-document-tab-item
              v-for="(document, id) in documents"
              :key="id"
              :label="document.displayName"
              :dirty="document.store().isDirty"
              :active="activeDocumentId === id"
              @activate="activateDocument(id)"
              @close="closeDocument(id)"
            />
          </mobile-popout-menu>
        </template>

        <toolbar
          :key="activeDocumentId"
          :store="activeDocument.store"
        />
        <toolbox
          :is-open="isToolboxOpen"
          :store="activeDocument.store"
        />
      </template>

      <template #middle>
        <tab-host>
          <!-- desktop-only document tabs -->
          <template v-if="!isMobile" #tabs>
            <tab-item
              v-for="(document, id) in documents"
              :key="id"
              :label="document.displayName"
              :active="activeDocumentId === id"
              :dirty="document.store().isDirty"
              @activate="activateDocument(id)"
              @close="closeDocument(id)"
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

        <!-- desktop-only bottom status bar -->
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

    <builder-view
      v-if="isBuilderOpen"
    />
  </theme>
</template>

<script lang="ts">
// TODO: the document/toolbox/toolbar stuff should be moved into a separate view called "Workspace.vue"
/// <reference path="./types/index.d.ts" />
import { faFile } from '@fortawesome/free-solid-svg-icons'
import { storeToRefs } from 'pinia'
import { defineComponent, onBeforeUnmount, onMounted, watchEffect, ref, computed } from 'vue'
import BuilderView from '@/views/BuilderView.vue'
import Document from './containers/Document.vue'
import MobilePreferences from './containers/MobilePreferences.vue'
import Oscilloscope from './containers/Oscilloscope.vue'
import StatusBar from './containers/StatusBar.vue'
import Toolbar from './containers/Toolbar.vue'
import Toolbox from './containers/Toolbox.vue'

import MainView from './components/layout/MainView.vue'
import MobileDocumentTabItem from './components/mobile/MobileDocumentTabItem.vue'
import MobileHeader from './components/mobile/MobileHeader.vue'
import MobilePopoutMenu from './components/mobile/MobilePopoutMenu.vue'
import MobilePopoutMenuItem from './components/mobile/MobilePopoutMenuItem.vue'
import MobilePullout from './components/mobile/MobilePullout.vue'
import MobilePulloutHeading from './components/mobile/MobilePulloutHeading.vue'
import TabItem from './components/tab/TabItem.vue'
import TabHost from './components/tab/TabHost.vue'
import Theme from './components/layout/Theme.vue'
import { useRootStore } from './store/root'
import isMobile from '@/utils/isMobile'
import createApplicationMenu from './menus'
import { usePreferencesStore } from './store/preferences'

export default defineComponent({
  name: 'App',
  components: {
    BuilderView,
    Document,
    Oscilloscope,
    MainView,
    MobileDocumentTabItem,
    MobileHeader,
    MobilePopoutMenu,
    MobilePopoutMenuItem,
    MobilePreferences,
    MobilePullout,
    MobilePulloutHeading,
    StatusBar,
    TabItem,
    TabHost,
    Theme,
    Toolbar,
    Toolbox
},
  setup () {
    const store = useRootStore()
    const { experience } = storeToRefs(usePreferencesStore())
    const {
      activeDocument,
      activeDocumentId,
      documents,
      hasOpenDocuments,
      isFullscreen,
      isDialogOpen,
      isBuilderOpen,
      isToolboxOpen,
      isSettingsOpen,
      isDocumentSelectOpen
    } = storeToRefs(store)
    const isDropping = ref(false)

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
      document.addEventListener('cut', onClipboard('cut'))
      document.addEventListener('copy', onClipboard('copy'))
      document.addEventListener('paste', onClipboard('paste'))
      window.addEventListener('focus', store.checkPastability)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('drop', onDrop)
      document.removeEventListener('cut', onClipboard('cut'))
      document.removeEventListener('copy', onClipboard('copy'))
      document.removeEventListener('paste', onClipboard('paste'))
      window.removeEventListener('focus', store.checkPastability)
    })

    let requestAnimationFrameId = 0

    function onClipboard (action: 'cut' | 'copy' | 'paste') {
      return function ($event: ClipboardEvent) {
        if (!($event.target instanceof HTMLInputElement)) {
          if (requestAnimationFrameId) return

          requestAnimationFrameId = requestAnimationFrame(() => {
            requestAnimationFrameId = 0
            store.invokeClipboardAction(action)
            cancelAnimationFrame(requestAnimationFrameId)
          })
        }

        store.checkPastability()
      }
    }

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

    function onContextMenu () {
      // window.api.showContextMenu([])
    }

    return {
      faFile,
      activeDocument,
      activeDocumentId,
      documents,
      experience,
      hasOpenDocuments,
      isDropping,
      isFullscreen,
      isDialogOpen,
      isBuilderOpen,
      isToolboxOpen,
      isSettingsOpen,
      isDocumentSelectOpen,
      onContextMenu,
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
// html {
//   overflow: hidden;
//   width: 100vw;
// }

// body {
//   height: 100vh;
//   width: 100vw;
//   overflow: hidden;
// }

.app {
  // height: 100vh;
  // overflow: hidden;

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
