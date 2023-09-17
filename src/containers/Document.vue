<template>
  <editor
    ref="editorRef"
    :zoom="store.zoom"
    :grid-size="gridSize"
    :tabindex="0"
    :canvas="store.canvas"
    :style="{
      '--color-on': colors.onColor.value,
      '--color-off': colors.offColor.value,
      '--color-hi-z': colors.unknownColor.value
    }"
    @pan="store.panDelta"
    @zoom="store.setZoom"
    @contextmenu="onContextMenu"
    @resize="store.setViewerSize"
  >
    <selector
      :zoom="store.zoom"
      @selection-end="store.createSelection"
      @selection-start="onDeselect"
      ref="selector"
    />

    <template
      v-if="store.hasLoaded"
      v-for="baseItem in store.baseItems"
    >
      <item
        v-if="'type' in baseItem"
        :store="storeDefinition"
        :id="baseItem.id"
        :key="baseItem.id"
        :is-selected="baseItem.isSelected"
        :flash="flash"
        :z-index="baseItem.zIndex + ITEM_BASE_Z_INDEX"
      />
      <!-- Note: z-index of items will be offset by ITEM_BASE_Z_INDEX to ensure they overlap wires -->

      <connection
        v-else
        :store="storeDefinition"
        :id="baseItem.id"
        :key="`c${baseItem.id}`"
        :is-selected="baseItem.isSelected"
        :flash="flash"
        :z-index="baseItem.zIndex"
      />
    </template>

    <port-item
      v-for="(port, id) in store.ports"
      :key="id"
      :port="port"
      :store="storeDefinition"
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
import { defineComponent, PropType, onMounted, onBeforeUnmount, ref, watchEffect, computed } from 'vue'
import Connection from './Connection.vue'
import Item from './Item.vue'
import PortItem from './PortItem.vue'
import Editor from '@/components/editor/Editor.vue'
import Selector from '@/components/editor/Selector.vue'
import Group from '@/components/Group.vue'
import editorContextMenu from '@/menus/context/editor'
import boundaries from '@/store/document/geometry/boundaries'
import printing from '@/utils/printing'
import { DocumentStore } from '@/store/document'
import { useRootStore } from '@/store/root'
import { storeToRefs } from 'pinia'
import { usePreferencesStore } from '@/store/preferences'
import { ARROW_KEY_MOMENTUM_MULTIPLIER, IMAGE_PADDING, ITEM_BASE_Z_INDEX } from '@/constants'
import BoundingBox from '@/types/types/BoundingBox'

export default defineComponent({
  name: 'Document',
  components: {
    Group,
    Editor,
    Selector,
    Connection,
    Item,
    PortItem
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
    const preferencesStore = usePreferencesStore()
    const editorRef = ref<typeof Editor>()
    const updates = ref(0)
    const { colors } = storeToRefs(preferencesStore)
    const flash = computed(() => store.isDebugging && store.isCircuitEvaluated)
    const gridSize = computed(() => preferencesStore.grid.showGrid.value ? preferencesStore.grid.gridSize.value : 0)

    let acceleration = 1
    let requestAnimationFrameId = 0

    watchEffect(() => {
      if (store.isPrinting) printImage()
      if (store.isCreatingImage) exportImage()
    })

    onMounted(() => {
      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('keyup', onKeyUp)
      window.addEventListener('blur', onKeyUp)
    })

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onKeyUp)
    })

    /**
     * Invokes the given callback with the editor and its computed bounding box of all elements.
     * This is used for rendering the document as an image that can be printed or exported to a file.
     */
    function initiatePrint (callback: (editorElement: HTMLElement, boundingBox: BoundingBox) => Promise<void>) {
      const boundingBoxes = Object
        .values(store.items)
        .map(({ boundingBox }) => boundingBox)
      const boundingBox = boundaries.getGroupBoundingBox(boundingBoxes)

      callback(editorRef.value!.grid, boundingBox)
    }

    /**
     * Prints the document using a physical printer.
     */
    async function printImage () {
      initiatePrint(async (editorElement, boundingBox) => {
        await printing.printImage(store.zoom, editorElement, boundingBox)

        store.isPrinting = false
      })
    }

    /**
     * Exports the document as an image.
     */
    async function exportImage () {
      initiatePrint(async (editorElement, boundingBox) => {
        const { printArea } = printing.createPrintArea(1 / store.zoom, editorElement, boundingBox, IMAGE_PADDING, '')
        const image = await printing.createImage<Blob>(printArea, 'toBlob')

        await rootStore.saveImage(image)

        store.isCreatingImage = false
      })
    }

    /**
     * Key down event handler, for document-specific commands that cannot be handled via a menu accelerator.
     */
    function onKeyDown ($event: KeyboardEvent) {
      if ($event.target instanceof HTMLInputElement) return
      if (requestAnimationFrameId) return

      requestAnimationFrameId = requestAnimationFrame(() => {
        requestAnimationFrameId = 0

        switch ($event.key) {
          case 'Escape':
            return store.deselectAll()
          case 'a':
            // the CommandOrControl+A accelerator doesn't work with Electron's menu
            // this is a workaround for that
            return $event.ctrlKey && store.selectAll()
          default:
            return moveItemsByArrowKey($event)
        }
      })
    }

    /**
     * Resets the arrow key momentum when the key is released.
     */
    function onKeyUp () {
      if (acceleration > 1) {
        store.commitCachedState()
        acceleration = 1
      }
    }

    /**
     * Moves the selected items by the given delta, based on the arrow key that was pressed.
     */
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

        if (acceleration === 1) {
          store.cacheState()
        }

        store.setSelectionPosition({
          x: delta.x * i,
          y: delta.y * i
        })
        acceleration *= ARROW_KEY_MOMENTUM_MULTIPLIER
      }
    }

    /**
     * Shows the editor context menu.
     */
    function onContextMenu ($event: Event) {
      window.api.showContextMenu(editorContextMenu(props.store))

      $event.preventDefault()
      $event.stopPropagation()
    }

    /**
     * Deselects all items when clicking on the background, unless the shift key is held down.
     * This is to allow a selection event to add to an existing selection by using the shift key.
     */
    function onDeselect (ctrlKey: boolean) {
      if (!ctrlKey) {
        store.deselectAll()
      }
    }

    return {
      store,
      editorRef,
      updates,
      colors,
      gridSize,
      flash,
      storeDefinition: props.store,
      ITEM_BASE_Z_INDEX,
      onKeyDown,
      onKeyUp,
      onContextMenu,
      onDeselect
    }
  }
})
</script>
