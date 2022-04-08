<template>
  <port-pivot
    :rotation="rotation"
    @keydown="onKeyDown"
    @keydown.esc="onEscapeKey"
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
      snap-mode="radius"
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
import Draggable from '../components/Draggable.vue'
import PortHandle from '../components/PortHandle.vue'
import PortPivot from '../components/PortPivot.vue'
import DocumentState from '@/store/DocumentState'
import PortType from '@/types/enums/PortType'

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

    let newFreeport: any = {}
    let isDragging = false

    function onKeyDown ($event: KeyboardEvent) {
      if ($event.key === 'c' || $event.key === ' ') {
        store.cycleDocumentPorts({
          portId: props.id,
          direction: 1,
          clearConnection: $event.key !== 'c'
        })
      }
    }

    function onEscapeKey ($event: KeyboardEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      emit('deselect', $event)
    }

    /**
     * Creates a new freeport that can be moved around using the mouse.
     */
    function dragStart () {
      isDragging = true

      const rand = () => `id_${(Math.floor(Math.random() * 1000000) + 5)}` // TODO: use uuid

      newFreeport = {
        itemId: rand(),
        position: props.position
      }

      if (props.type === PortType.Input) {
        newFreeport.outputPortId = rand()
        newFreeport.targetId = props.id
        newFreeport.portType = 0
      } else {
        newFreeport.inputPortId = rand()
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

    return {
      store,
      isDragging,
      onKeyDown,
      onEscapeKey,
      dragStart,
      dragEnd
    }
  },
  // watch: {
  //   activePortId (activePortId) {
  //     if (activePortId === this.id && document.activeElement !== this.$el) {
  //       this.$el.focus()
  //     }
  //   }
  // },
})
</script>
