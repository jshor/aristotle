<template>
  <port-pivot
    :rotation="rotation"
    @blur="onBlur"
    @keydown.esc="onEscapeKey"
    @keydown.space="store.cycleConnectionPreviews(id)"
    @keydown.enter="store.commitPreviewedConnection"
    @contextmenu="store.setActivePortId(id)"
  >
    <draggable
      v-if="!isFreeport"
      :snap-boundaries="store.snapBoundaries"
      :zoom="store.zoomLevel"
      :bounding-box="{
        left: position.x,
        top: position.y,
        right: position.x,
        bottom: position.y
      }"
      :lock-visual="true"
      :snap-mode="snapMode"
      @drag-start="dragStart"
      @drag-end="dragEnd"
    >
      <port-handle
        :type="type"
        :active="store.activePortId === id || store.connectablePortIds.includes(id)"
      />
    </draggable>
    <port-handle
      v-else
      :type="type"
      :active="store.activePortId === id || store.connectablePortIds.includes(id)"
    />
  </port-pivot>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { StoreDefinition } from 'pinia'
import { v4 as uuid } from 'uuid'
import Draggable from '../components/editor/Draggable.vue'
import PortHandle from '../components/PortHandle.vue'
import PortPivot from '../components/PortPivot.vue'
import DocumentState from '@/store/DocumentState'
import PortType from '@/types/enums/PortType'
import SnapMode from '@/types/enums/SnapMode'

export default defineComponent({
  name: 'PortItem',
  components: {
    Draggable,
    PortHandle,
    PortPivot
  },
  props: {
    /**
     * Port ID.
     */
    id: {
      type: String,
      default: ''
    },

    /**
     * Unit circle rotation value (0, 1, 2, 3).
     */
    rotation: {
      type: Number,
      default: 0
    },

    /**
     * Position of the port on the canvas.
     */
    position: {
      type: Object as PropType<Point>,
      default: () => ({
        x: 0,
        y: 0
      })
    },

    /**
     * Whether or not the port is draggable.
     */
    isFreeport: {
      type: Boolean,
      default: false
    },

    /**
     * The port type.
     * - 0 = output
     * - 1 = input
     * - 2 = freeport
     */
    type: {
      type: Number,
      default: 0
    },

    /**
     * Port directional orientation.
     */
    orientation: {
      type: Number,
      default: 0
    },

    connectedPortIds: {
      type: Object as PropType<string[]>,
      default: []
    },

    store: {
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  setup (props, { emit }) {
    const store = props.store()
    const snapMode = SnapMode.Radial

    let newFreeport: any = {}
    let isDragging = false

    function onEscapeKey ($event: KeyboardEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      emit('deselect', $event)
    }

    function onBlur () {
      store.unsetConnectionPreview()
      store.cachedState = null
    }

    /**
     * Creates a new freeport that can be moved around using the mouse.
     */
    function dragStart () {
      isDragging = true

      newFreeport = {
        itemId: uuid(),
        position: props.position
      }

      if (props.type === PortType.Input) {
        newFreeport.outputPortId = uuid()
        newFreeport.targetId = props.id
        newFreeport.portType = 0
      } else {
        newFreeport.inputPortId = uuid()
        newFreeport.sourceId = props.id
        newFreeport.portType = 1
      }

      store.createFreeport(newFreeport)
      store.setConnectablePortIds({ portId: props.id, isDragging: true })
    }

    /**
     * Handles terminating the temporary active port, and connects the port to the one at its dragged location.
     * This method handles all results of a user-driven port-dragging interaction.
     */
    function dragEnd () {
      if (!isDragging) return

      isDragging = false

      if (props.type === PortType.Output) {
        store.connectFreeport({
          portId: newFreeport.inputPortId,
          sourceId: props.id
        })
      } else {
        store.connectFreeport({
          portId: newFreeport.outputPortId,
          targetId: props.id
        })
      }
    }

    function onContextMenu () {
      if (store.activePortId !== props.id) {
        store.setActivePortId(props.id)
      }
    }

    return {
      store,
      snapMode,
      isDragging,
      onEscapeKey,
      onBlur,
      dragStart,
      dragEnd,
      PortType
    }
  }
})
</script>
