<template>
  <theme
    :dark="experience.darkMode.value"
    :style="colorStyles"
  >
    <div
      class="app__dropzone"
      :class="{
        'app__dropzone--active': isDropping
      }"
    />

    <workspace
      v-if="activeDocument"
      :is-mobile="isMobile"
    />

    <welcome
      v-else
      :is-mobile="isMobile"
    />

    <desktop-preferences />
  </theme>
</template>

<script lang="ts">
import { storeToRefs } from 'pinia'
import { defineComponent, onBeforeUnmount, onMounted, watchEffect, ref } from 'vue'
import DesktopPreferences from './containers/dialogs/DesktopPreferences.vue'
import Theme from './components/layout/Theme.vue'
import Welcome from './containers/Welcome.vue'
import Workspace from './containers/Workspace.vue'
import { useRootStore } from './store/root'
import isMobile from '@/utils/isMobile'
import { usePreferencesStore } from './store/preferences'
import { createApplicationMenu } from '@/menus'

export default defineComponent({
  name: 'App',
  components: {
    DesktopPreferences,
    Document,
    Theme,
    Welcome,
    Workspace
},
  setup () {
    const store = useRootStore()
    const { colorStyles, experience } = storeToRefs(usePreferencesStore())
    const { activeDocument } = storeToRefs(store)
    const isDropping = ref(false)

    window.api.onBeforeClose(store.closeApplication)
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

    watchEffect(() => window.api.setApplicationMenu(createApplicationMenu()))
    watchEffect(() => document.title = store.title)

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
      colorStyles,
      experience,
      isDropping,
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
