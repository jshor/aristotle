<template>
  <main-view v-if="activeDocument">
    <template #top>
      <mobile-preferences v-if="isMobile" />

      <toolbar
        :key="activeDocumentId!"
        :store="activeDocument.store"
        @contextmenu="onContextMenu"
      />
      <toolbox
        :is-open="isToolboxOpen"
        :store="activeDocument.store"
        @contextmenu="onContextMenu"
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
            @activate="activateDocument(id.toString())"
            @close="closeDocument(id.toString())"
            @contextmenu="onContextMenu"
          />
        </template>
        <template #default>
          <document
            :key="`document-${activeDocumentId}`"
            :store="activeDocument.store"
            @switch="switchDocument"
            @open-integrated-circuit="openIntegratedCircuit"
          />
          <oscilloscope
            :key="`oscilloscope-${activeDocumentId}`"
            :store="activeDocument.store"
            @contextmenu="onContextMenu"
          />
        </template>
      </tab-host>
    </template>

    <template #bottom>
      <!-- desktop-only bottom status bar -->
      <status-bar
        v-if="!isMobile"
        :key="activeDocumentId!"
        :store="activeDocument.store"
        :is-fullscreen="isFullscreen"
        @fullscreen="toggleFullscreen"
        @contextmenu="onContextMenu"
      />
    </template>
  </main-view>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { onBeforeUnmount, onMounted } from 'vue'
import Document from './Document.vue'
import MobilePreferences from './MobilePreferences.vue'
import Oscilloscope from './Oscilloscope.vue'
import StatusBar from './StatusBar.vue'
import Toolbar from './Toolbar.vue'
import Toolbox from './Toolbox.vue'
import MainView from '@/components/layout/MainView.vue'
import TabItem from '@/components/tab/TabItem.vue'
import TabHost from '@/components/tab/TabHost.vue'
import { useRootStore } from '@/store/root'

withDefaults(defineProps<{
  /** Whether or not the workspace is to be displayed in mobile mode. */
  isMobile: boolean
}>(), {
  isMobile: false
})

const store = useRootStore()
const {
  activeDocument,
  activeDocumentId,
  documents,
  isFullscreen,
  isToolboxOpen
} = storeToRefs(store)

const {
  activateDocument,
  closeDocument,
  openIntegratedCircuit,
  switchDocument,
  toggleFullscreen
} = store

onMounted(() => {
  window.addEventListener('focus', store.checkPasteability)
})

onBeforeUnmount(() => {
  window.removeEventListener('focus', store.checkPasteability)
})

function onContextMenu () {
  window.api.showContextMenu([])
}
</script>
