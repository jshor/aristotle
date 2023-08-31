<template>
  <editor
    ref="editor"
    :zoom="store.zoomLevel"
    :grid-size="grid.showGrid.value ? grid.gridSize.value : 0"
    :tabindex="0"
    :offset="{
      x: store.canvas.left,
      y: store.canvas.top
    }"
    :style="{
      '--color-on': colors.onColor.value,
      '--color-off': colors.offColor.value,
      '--color-hi-i': colors.unknownColor.value
    }"
    :width="store.canvas.right - store.canvas.left"
    :height="store.canvas.bottom - store.canvas.top"
    @pan="store.panTo"
    @deselect="store.deselectAll"
    @selection="store.createSelection"
    @zoom="store.setZoom"
    @contextmenu="onContextMenu"
    @resize="store.setViewerSize"
  >
    <!-- when tabbed into, this resets the selection back to the last item -->
    <div
      :tabindex="0"
      @focus="store.recycleSelection(false)"
    />

    <template
      v-if="store.hasLoaded"
      v-for="baseItem in store.baseItems"
    >
      <item
        v-if="'type' in baseItem"
        :tabindex="0"
        :store="storeDefinition"
        :id="baseItem.id"
        :key="baseItem.id"
        :is-selected="baseItem.isSelected"
        :flash="store.isDebugging && store.isCircuitEvaluated"
        :z-index="baseItem.zIndex + 1000"
        @contextmenu="onContextMenu"
      />
      <!-- Note: z-index of items will be offset by +1000 to ensure it always overlaps wires -->

      <connection
        v-else
        :tabindex="0"
        :store="storeDefinition"
        :id="baseItem.id"
        :key="`c${baseItem.id}`"
        :is-selected="baseItem.isSelected"
        :is-preview="store.connectionPreviewId === baseItem.id"
        :flash="store.isDebugging && store.isCircuitEvaluated"
        :z-index="baseItem.zIndex"
        @contextmenu="onContextMenu"
      />
    </template>

    <!-- when tabbed into, this resets the selection back to the first item -->
    <div
      :tabindex="0"
      @focus="store.recycleSelection(true)"
    />

    <group
      v-for="group in store.groups"
      :key="group.id"
      :id="group.id"
      :bounding-box="group.boundingBox"
      :is-selected="group.isSelected"
      :z-index="store.zIndex"
      :zoom="store.zoom"
    />
  </editor>
</template>

<script lang="ts">
import { defineComponent, PropType, onMounted, onBeforeUnmount, ref, ComponentPublicInstance, watchEffect } from 'vue'
import Connection from './Connection.vue'
import Item from './Item.vue'
import Editor from '@/components/editor/Editor.vue'
import Group from '@/components/Group.vue'
import editorContextMenu from '@/menus/context/editor'
import boundaries from '@/store/document/geometry/boundaries'
import printing from '@/utils/printing'
import { DocumentStore } from '@/store/document'
import { useRootStore } from '@/store/root'
import { storeToRefs } from 'pinia'
import { usePreferencesStore } from '@/store/preferences'

export default defineComponent({
  name: 'Document',
  components: {
    Group,
    Editor,
    Connection,
    Item
  },
  props: {
    store: {
      type: Function as PropType<DocumentStore>,
      required: true
    }
  },
  setup (props) {
    const store = props.store()
    const rootStore = useRootStore()
    const editor = ref<ComponentPublicInstance<HTMLElement>>()
    const updates = ref(0)
    const { colors, grid } = storeToRefs(usePreferencesStore())

    let acceleration = 1
    let keys: Record<string, boolean> = {}

    watchEffect(() => {
      if (store.isPrinting) printImage()
      if (store.isCreatingImage) exportImage()
    })

    onMounted(() => {
      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('keyup', onKeyUp)
      document.addEventListener('cut', onClipboard('cut'))
      document.addEventListener('copy', onClipboard('copy'))
      document.addEventListener('paste', onClipboard('paste'))
      window.addEventListener('blur', clearKeys)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.addEventListener('cut', onClipboard('cut'))
      document.addEventListener('copy', onClipboard('copy'))
      document.addEventListener('paste', onClipboard('paste'))
      window.removeEventListener('blur', clearKeys)
    })

    function initiatePrint (callback: (editorElement: HTMLElement, boundingBox: BoundingBox) => Promise<void>) {
      if (editor.value) {
        const boundingBoxes = Object
          .values(store.items)
          .map(({ boundingBox }) => boundingBox)
        const boundingBox = boundaries.getGroupBoundingBox(boundingBoxes)
        const editorElement = editor.value.$el.querySelector('.editor__grid') as HTMLElement

        callback(editorElement, boundingBox)
      }
    }

    async function printImage () {
      initiatePrint(async (editorElement, boundingBox) => {
        await printing.printImage(store.zoom, editorElement, boundingBox)

        store.isPrinting = false
      })
    }

    async function exportImage () {
      initiatePrint(async (editorElement, boundingBox) => {
        const { printArea } = printing.createPrintArea(1 / store.zoom, editorElement, boundingBox, 20, '')
        const image = await printing.createImage<Blob>(printArea, 'toBlob')

        await rootStore.saveImage(image)

        store.isCreatingImage = false
      })
    }


    function onClipboard (action: 'cut' | 'copy' | 'paste') {
      return function ($event: ClipboardEvent) {
        if ($event.target instanceof HTMLInputElement) return

        store[action]()
        $event.preventDefault()
      }
    }

    function onKeyDown ($event: KeyboardEvent) {
      if ($event.target instanceof HTMLInputElement) return

      switch ($event.key) {
        case 'Escape':
          return store.deselectAll()
        case 'a':
          return $event.ctrlKey && store.selectAll()
        default:
          return moveItemsByArrowKey($event)
      }
    }

    function onKeyUp ($event: KeyboardEvent) {
      keys[$event.key] = false
      acceleration = 1
    }

    function onContextMenu ($event: Event) {
      window.api.showContextMenu(editorContextMenu(props.store))

      $event.preventDefault()
      $event.stopPropagation()
    }

    function moveItemsByArrowKey ($event: KeyboardEvent) {
      const delta = (() => {
        switch ($event.key) {
          case 'ArrowLeft':
            return { x: -1, y: 0 }
          case 'ArrowUp':
            return { x: 0, y: -1 }
          case 'ArrowRight':
            return { x: 1, y: 0 }
          case 'ArrowDown':
            return { x: 0, y: 1 }
        }
      })()

      if (delta) {
        const i = Math.min(acceleration, 10)

        store.moveSelectionPosition({
          x: delta.x * i,
          y: delta.y * i
        })
        acceleration *= 1.05
      }
    }

    function clearKeys () {
      keys = {}
    }

    return {
      store,
      editor,
      updates,
      colors,
      grid,
      storeDefinition: props.store,
      onKeyDown,
      onKeyUp,
      onContextMenu,
      clearKeys
    }
  }
})
</script>
