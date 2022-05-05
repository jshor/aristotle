<template>
  <editor
    ref="editor"
    :zoom="store.zoomLevel"
    :grid-size="gridSize"
    :tabindex="0"
    :offset="{
      x: store.canvas.left,
      y: store.canvas.top
    }"
    :width="store.canvas.right - store.canvas.left"
    :height="store.canvas.bottom - store.canvas.top"
    @pan="store.panTo"
    @deselect="store.deselectAll"
    @selection="store.createSelection"
    @zoom="store.setZoom"
    @on-context-menu="onContextMenu"
    @mousedown="store.deselectAll"
  >
    <!-- when tabbed into, this resets the selection back to the last item -->
    <div
      :tabindex="0"
      @focus="store.recycleSelection(false)"
    />

    <template v-for="(baseItem, index) in store.baseItems">
      <item
        v-if="baseItem.type"
        :store="storeDefinition"
        :id="baseItem.id"
        :key="baseItem.id"
        :port-ids="baseItem.portIds"
        :type="baseItem.type"
        :subtype="baseItem.subtype"
        :name="baseItem.name"
        :position="baseItem.position"
        :rotation="baseItem.rotation"
        :group-id="baseItem.groupId"
        :bounding-box="baseItem.boundingBox"
        :properties="baseItem.properties"
        :is-selected="baseItem.isSelected"
        :flash="store.isDebugging && store.isCircuitEvaluated"
        :z-index="baseItem.zIndex + 1000"
        @select="selectItem(baseItem.id)"
        @deselect="deselectItem(baseItem.id)"
        @contextmenu="onContextMenu"
        @open-integrated-circuit="$emit('openIntegratedCircuit', baseItem)"
      />
      <!-- Note: z-index of items will be offset by +1000 to ensure it always overlaps wires -->

      <connection
        v-else
        :store="storeDefinition"
        :id="baseItem.id"
        :key="index"
        :source-id="baseItem.source"
        :target-id="baseItem.target"
        :group-id="baseItem.groupId"
        :connection-chain-id="baseItem.connectionChainId"
        :is-selected="baseItem.isSelected"
        :is-preview="store.connectionPreviewId === baseItem.id"
        :flash="store.isDebugging && store.isCircuitEvaluated"
        :z-index="baseItem.zIndex"
        @select="selectItem(baseItem.id)"
        @deselect="deselectItem(baseItem.id)"
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
import { defineComponent, PropType, onMounted, onBeforeUnmount, ref, ComponentPublicInstance } from 'vue'
import ResizeObserver from 'resize-observer-polyfill'
import { StoreDefinition } from 'pinia'
import DocumentState from '@/store/DocumentState'
import Editor from '@/components/Editor.vue'
import Group from '@/components/Group.vue'
import Connection from './Connection.vue'
import Item from './Item.vue'
import editorContextMenu from '@/menus/context/editor'

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
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  setup (props, { emit }) {
    const store = props.store()
    const editor = ref<ComponentPublicInstance<HTMLElement>>()

    let acceleration = 1
    let keys: Record<string, boolean> = {}

    onMounted(() => {
      document.addEventListener('keydown', onKeyDown)
      document.addEventListener('keyup', onKeyUp)
      document.addEventListener('cut', onClipboard('cut'))
      document.addEventListener('copy', onClipboard('copy'))
      document.addEventListener('paste', onClipboard('paste'))
      // document.addEventListener('delete', onClipboard('delete'))
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
        case 'Delete':
          return store.selectAll()
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
      window.api.showContextMenu(editorContextMenu(store))

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

    /**
     * Selects an item having the given id (`Item` or `Connection`).
     * If the shift key is not held down, then any existing selection is cleared.
     */
    function selectItem (id: string) {
      if (!keys.Control) { // TODO: command too (for mac?)
        store.deselectAll()
      }

      store.setSelectionState({ id, value: true })
    }

    function deselectItem (id: string) {
      if (!keys.Control) { // TODO: command too (for mac?)
        store.setSelectionState({ id, value: false })
      }
    }

    function onSizeChanged ([ target ]: ResizeObserverEntry[]) {
      store.setViewerSize(target.target.getBoundingClientRect())
    }

    const observer = new ResizeObserver(onSizeChanged)

    onMounted(() => {
      if (editor.value) {
        observer.observe(editor.value.$el)
      }
    })

    return {
      store,
      editor,
      storeDefinition: props.store,
      onKeyDown,
      onKeyUp,
      onContextMenu,
      clearKeys,
      selectItem,
      deselectItem,
      gridSize: 20
    }
  }
})
</script>
