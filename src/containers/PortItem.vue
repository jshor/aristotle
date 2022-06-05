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
      @drag-start="onDragStart"
      @drag="onDrag"
      @drag-end="onDragEnd"
      @touchhold="store.togglePortMonitoring(id)"
      @dblclick="store.togglePortMonitoring(id)"
      :tabindex="-1"
    >
      <port-handle
        :type="type"
        :hue="hue"
        :active="store.activePortId === id || store.connectablePortIds.includes(id)"
        touch-friendly
      />
    </draggable>
    <port-handle
      v-else
      :type="type"
      :hue="hue"
      :active="store.activePortId === id || store.connectablePortIds.includes(id)"
    />
  </port-pivot>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { v4 as uuid } from 'uuid'
import PortHandle from '../components/PortHandle.vue'
import PortPivot from '../components/PortPivot.vue'
import { DocumentStore } from '@/store/document'
import PortType from '@/types/enums/PortType'
import SnapMode from '@/types/enums/SnapMode'
import Draggable from '@/components/interactive/Draggable.vue'

export default defineComponent({
  name: 'PortItem',
  components: {
    PortHandle,
    PortPivot,
    Draggable
},
  props: {
    /** Port ID. */
    id: {
      type: String,
      default: ''
    },

    /** Unit circle rotation value (0, 1, 2, 3). */
    rotation: {
      type: Number,
      default: 0
    },

    /** Position of the port on the canvas. */
    position: {
      type: Object as PropType<Point>,
      default: () => ({
        x: 0,
        y: 0
      })
    },

    /** Whether or not the port is draggable. */
    isFreeport: {
      type: Boolean,
      default: false
    },

    /** The port type (input or output). */
    type: {
      type: Number,
      default: 0
    },

    /** Port directional orientation. */
    orientation: {
      type: Number,
      default: 0
    },

    /** Color hue of the port. */
    hue: {
      type: Number,
      default: 0
    },

    /** List of IDs of ports that are connected to this port. */
    connectedPortIds: {
      type: Object as PropType<string[]>,
      default: []
    },

    /** Document store instance. */
    store: {
      type: Function as PropType<DocumentStore>,
      required: true
    }
  },
  setup (props, { emit }) {
    const store = props.store()
    const snapMode = SnapMode.Radial

    let newFreeport: Freeport | null = null
    let draggedPortId = ''
    let isAdded = false

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
    function onDragStart () {
      newFreeport = {
        itemId: uuid()
      }
      draggedPortId = uuid()
      isAdded = false

      if (props.type === PortType.Input) {
        newFreeport.outputPortId = draggedPortId
        newFreeport.targetId = props.id
      } else {
        newFreeport.inputPortId = draggedPortId
        newFreeport.sourceId = props.id
      }
    }

    function onDrag ({ x, y }: MouseEvent) {
      if (newFreeport === null) return

      if (!isAdded) {
        store.createFreeport(newFreeport, false)
        store.setConnectablePortIds({ portId: props.id, isDragging: true })
        store.setSnapBoundaries(draggedPortId)
      }

      store.dragItem(newFreeport.itemId, { x, y }, SnapMode.Radial)
    }

    /**
     * Handles terminating the temporary active port, and connects the port to the one at its dragged location.
     * This method handles all results of a user-driven port-dragging interaction.
     */
    function onDragEnd () {
      if (newFreeport === null) return

      if (newFreeport.inputPortId) {
        store.connectFreeport({
          portId: newFreeport.inputPortId,
          sourceId: props.id
        })
      } else if (newFreeport.outputPortId) {
        store.connectFreeport({
          portId: newFreeport.outputPortId,
          targetId: props.id
        })
      }
    }

    return {
      store,
      snapMode,
      onDragStart,
      onDrag,
      onDragEnd,
      onEscapeKey,
      onBlur,
      PortType
    }
  }
})
</script>
