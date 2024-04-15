<template>
  <editor
    ref="editorRef"
    :zoom="store.zoom"
    :grid-size="gridSize"
    :tabindex="0"
    :canvas="store.canvas"
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
import { defineComponent, PropType, onBeforeUnmount, ref, watch, computed, onMounted } from 'vue'
import Connection from './Connection.vue'
import Item from './Item.vue'
import PortItem from './PortItem.vue'
import Editor from '@/components/editor/Editor.vue'
import Selector from '@/components/editor/Selector.vue'
import Group from '@/components/Group.vue'
import boundaries from '@/store/document/geometry/boundaries'
import printing from '@/utils/printing'
import { DocumentStore } from '@/store/document'
import { useRootStore } from '@/store/root'
import { usePreferencesStore } from '@/store/preferences'
import { ARROW_KEY_MOMENTUM_MULTIPLIER, IMAGE_PADDING, ITEM_BASE_Z_INDEX, PRINTER_FRIENDLY_COLORS } from '@/constants'
import BoundingBox from '@/types/types/BoundingBox'
import Point from '@/types/interfaces/Point'
import { DocumentStatus } from '@/types/enums/DocumentStatus'
import { ViewType } from '@/types/enums/ViewType'
import { createEditSubmenu } from '@/menus/submenus/edit'

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
    const flash = computed(() => store.isDebugging && store.isCircuitEvaluated)
    const gridSize = computed(() => {
      return preferencesStore.grid.showGrid.value
        ? preferencesStore.grid.gridSize.value
        : 0
    })

    let acceleration = 1
    let keydownAnimationFrameId = 0
    let clipboardAnimationFrameId = 0

    // add event listeners when the document is viewed, or remove them otherwise
    watch(() => rootStore.viewType, viewType => {
      if (viewType === ViewType.Document) {
        onDocumentReady()
      } else {
        offDocumentReady()
      }
    }, { immediate: true })

    watch(() => store.status, onDocumentStatus, { immediate: true })

    onBeforeUnmount(offDocumentReady)

    /**
     * Handles the requested document status.
     */
    function onDocumentStatus (status: DocumentStatus) {
      switch (status) {
        case DocumentStatus.Printing:
          return printImage()
        case DocumentStatus.SavingImage:
          return exportImage()
      }
    }

    /**
     * Adds clipboard and keyboard event listeners.
     */
    function onDocumentReady () {
      document.addEventListener('cut', onCut)
      document.addEventListener('copy', onCopy)
      document.addEventListener('paste', onPaste)
      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('keyup', onKeyUp)
      window.addEventListener('blur', onKeyUp)
    }

    /**
     * Removes clipboard and keyboard event listeners.
     */
    function offDocumentReady () {
      document.removeEventListener('cut', onCut)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onKeyUp)
    }

    /**
     * Cuts the selection from this document.
     */
    function onCut ($event: ClipboardEvent) {
      return onClipboard('cut', $event)
    }

    /**
     * Copies the document selection to the clipboard.
     */
    function onCopy ($event: ClipboardEvent) {
      return onClipboard('copy', $event)
    }

    /**
     * Pastes from the clipboard into the document.
     */
    function onPaste ($event: ClipboardEvent) {
      return onClipboard('paste', $event)
    }

    /**
     * Clipboard event handler.
     */
    function onClipboard (action: 'cut' | 'copy' | 'paste', $event: ClipboardEvent) {
      if (!($event.target instanceof HTMLInputElement)) {
        if (clipboardAnimationFrameId) return

        clipboardAnimationFrameId = requestAnimationFrame(() => {
          clipboardAnimationFrameId = 0
          store[action]()
          cancelAnimationFrame(clipboardAnimationFrameId)
        })
      }

      rootStore.checkPasteability()
    }

    /**
     * Key down event handler, for document-specific commands that cannot be handled via a menu accelerator.
     */
    function onKeyDown ($event: KeyboardEvent) {
      if ($event.target instanceof HTMLInputElement) return
      if (keydownAnimationFrameId) return

      keydownAnimationFrameId = requestAnimationFrame(() => {
        keydownAnimationFrameId = 0

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
      setTimeout(() => {
        window.api.showContextMenu(createEditSubmenu(props.store))
      })

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

    /**
     * Prints the document using a physical printer.
     */
    async function printImage () {
      initiatePrint(async (editorElement, boundingBox, styles) => {
        await printing.printImage(editorElement, boundingBox, {
          ...styles,
          ...PRINTER_FRIENDLY_COLORS
        })

        store.status = DocumentStatus.Ready
      })
    }

    /**
     * Exports the document as an image.
     */
    async function exportImage () {
      initiatePrint(async (editorElement, boundingBox, styles) => {
        const { printArea } = printing.createPrintArea(editorElement, boundingBox, IMAGE_PADDING, styles)
        const image = await printing.createImage<Blob>(printArea, 'toBlob')

        await rootStore.saveImage(image)

        store.status = DocumentStatus.Ready
      })
    }

    /**
     * Invokes the given callback with the editor and its computed bounding box of all elements.
     * This is used for rendering the document as an image that can be printed or exported to a file.
     */
    function initiatePrint (callback: (
      editorElement: HTMLElement,
      boundingBox: BoundingBox,
      styles: Record<string, string>
    ) => Promise<void>) {
      const points = Object
        .values(store.connections)
        .reduce((points, { controlPoints }) => points.concat(
          controlPoints.map(({ position }) => position)
        ), [] as Point[])
      const boundingBoxes = Object
        .values(store.items)
        .map(({ boundingBox }) => boundingBox)
        .concat(boundaries.getConstellationBoundingBox(points))
      const boundingBox = boundaries.getGroupBoundingBox(boundingBoxes)

      callback(editorRef.value!.grid, boundingBox, {
        'zoom': `${(1 / store.zoom)}`,
        '--media-display': 'none',
        '--color-selection': 'transparent !important',
        ...preferencesStore.colorStyles
      })
    }

    return {
      store,
      editorRef,
      updates,
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
