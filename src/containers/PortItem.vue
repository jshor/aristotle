<template>
  <wire-draggable
    v-if="wire"
    :geometry="wire.geometry"
    :style="{
      left: wire.position?.x + 'px',
      top: wire.position?.y + 'px'
    }"
    :source-value="port.value"
  />
  <port-handle
    v-if="wire"
    :style="{
      left: wire.targetPosition?.x + 'px',
      top: wire.targetPosition?.y + 'px',
      transform: `translate(-50%, -50%)`
    }"
  />
  <draggable
    :position="port.position"
    :style="{ zIndex }"
    @drag-start="createConnectionExperiment(port.id)"
    @drag="updateConnectionExperiment"
    @drag-end="terminateConnectionExperiment"
    @touchhold="onTouchHold"
    @dblclick="onDoubleClick"
  >
    <port-pivot>
      <port-handle
        :active="isActive"
        :hue="port.isMonitored ? port.hue : 0"
      />
    </port-pivot>
  </draggable>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import PortHandle from '@/components/port/PortHandle.vue'
import PortPivot from '@/components/port/PortPivot.vue'
import { DocumentStore } from '@/store/document'
import Draggable from '@/components/interactive/Draggable.vue'
import renderLayout from '@/store/document/geometry/wire'
import Port from '@/types/interfaces/Port'
import WireDraggable from './WireDraggable.vue'
import { ITEM_BASE_Z_INDEX } from '@/constants'
import Direction from '@/types/enums/Direction'

export default defineComponent({
  name: 'PortItem',
  components: {
    WireDraggable,
    PortHandle,
    PortPivot,
    Draggable
  },
  props: {
    port: {
      type: Object as PropType<Port>,
      required: true
    },

    /** Document store instance. */
    store: {
      type: Function as PropType<DocumentStore>,
      required: true
    }
  },
  setup (props, { emit }) {
    const store = props.store()
    const {
      createConnectionExperiment,
      updateConnectionExperiment,
      terminateConnectionExperiment
    } = store
    const isActive = computed(() => store.activePortId === props.port.id || store.connectablePortIds.has(props.port.id))
    const wire = computed(() => {
      if (store.connectionExperiment?.sourceId !== props.port.id) {
        // if this port is not part of the active connection experiment then there is no wire to render
        return null
      }

      const { targetPosition } = store.connectionExperiment
      const geometry = renderLayout(props.port, {
        position: targetPosition,
        orientation: Direction.Right,
        rotation: props.port.rotation,
        canInflect: true
      })
      const position = {
        x: Math.min(props.port.position.x, targetPosition.x) + geometry.minX,
        y: Math.min(props.port.position.y, targetPosition.y) + geometry.minY
      }

      return { geometry, position, targetPosition }
    })

    // use the same CSS z-index value for the port as its parent item
    const zIndex = computed(() => store.items[props.port.elementId].zIndex + ITEM_BASE_Z_INDEX)

    function onEscapeKey ($event: KeyboardEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      emit('deselect', $event)
    }

    function onBlur () {
      store.unsetConnectionPreview()
      store.cachedState = null
    }

    function onTouchHold ($event: TouchEvent) {
      $event.stopPropagation()
      $event.preventDefault()
      navigator.vibrate(100)

      store.togglePortMonitoring(props.port.id)
    }

    function onDoubleClick ($event: MouseEvent) {
      $event.stopPropagation()
      $event.preventDefault()

      store.togglePortMonitoring(props.port.id)
    }

    return {
      wire,
      isActive,
      store,
      zIndex,
      onEscapeKey,
      onBlur,
      onTouchHold,
      onDoubleClick,
      createConnectionExperiment,
      updateConnectionExperiment,
      terminateConnectionExperiment
    }
  }
})
</script>
