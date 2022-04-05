<template>
  <port-pivot
    :rotation="rotation"
    @keydown="onKeyDown"
    @keydown.esc="onEscapeKey"
  >
    <draggable
      v-if="!isFreeport"
      :snap-boundaries="snapBoundaries"
      :zoom="zoom"
      :bounding-box="{
        left: position.x,
        top: position.y,
        right: position.x,
        bottom: position.y
      }"
      :key="isDragging"
      snap-mode="radius"
      @drag-start="dragStart"
      @drag-end="dragEnd"
    >
      <port-handle
        :type="type"
        :active="activePortId === id || connectablePortIds.includes(id)"
      />
    </draggable>
    <port-handle
      v-else
      :type="type"
      :active="activePortId === id || connectablePortIds.includes(id)"
    />
  </port-pivot>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { mapActions, mapState } from 'pinia'
import { useDocumentStore } from '../store/document'
import Draggable from '../components/Draggable.vue'
import PortHandle from '../components/PortHandle.vue'
import PortPivot from '../components/PortPivot.vue'

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
    }
  },
  data () {
    return {
      newFreeport: {} as any,
      isDragging: false
    }
  },
  watch: {
    activePortId (activePortId) {
      if (activePortId === this.id && document.activeElement !== this.$el) {
        this.$el.focus()
      }
    }
  },
  computed: {
    ...mapState(useDocumentStore, [
      'activePortId',
      'connectablePortIds',
      'snapBoundaries',
      'zoom'
    ]),
    isSelected () {
      return this.activePortId === this.id
    },
    label () {
      if (this.connectedPortIds.length > 0) {
        return `${this.id} Connected to: ${this.connectedPortIds.join(', ')}`
      }
      return `${this.id} Not connected to anything.`
    }
  },
  methods: {
    ...mapActions(useDocumentStore, [
      'connectFreeport',
      'createFreeport',
      'cycleDocumentPorts',
      'setConnectablePortIds'
    ]),

    onKeyDown ($event: KeyboardEvent) {
      if ($event.key === 'c' || $event.key === ' ') {
        this.cycleDocumentPorts({
          portId: this.id,
          direction: 1,
          clearConnection: $event.key !== 'c'
        })
      }
    },

    onEscapeKey ($event: KeyboardEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      this.$emit('deselect', $event)
    },

    /**
     * Creates a new freeport that can be moved around using the mouse.
     */
    dragStart () {
      this.isDragging = true

      const rand = () => `id_${(Math.floor(Math.random() * 1000000) + 5)}` // TODO: use uuid

      this.newFreeport = {
        itemId: rand(),
        position: this.position
      }

      if (this.type === 1) {
        this.newFreeport.outputPortId = rand()
        this.newFreeport.targetId = this.id
        this.newFreeport.portType = 0
      } else {
        this.newFreeport.inputPortId = rand()
        this.newFreeport.sourceId = this.id
        this.newFreeport.portType = 1
      }

      this.createFreeport(this.newFreeport)
      this.setConnectablePortIds({ portId: this.id })
    },

    /**
     * Handles terminating the temporary active port, and connects the port to the one at its dragged location.
     * This method handles all results of a user-driven port-dragging interaction.
     */
    dragEnd () {
      if (!this.isDragging) return

      this.isDragging = false

      if (this.type === 0) {
        this.connectFreeport({
          portId: this.newFreeport.inputPortId,
          sourceId: this.id
        })
      } else {
        this.connectFreeport({
          portId: this.newFreeport.outputPortId,
          targetId: this.id
        })
      }
    }
  }
})
</script>
