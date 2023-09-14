<template>
  <draggable
    :style="{ zIndex }"
    :position="position"
    :is-selected="isSelected"
    :allow-touch-drag="freeportId !== null"
    @touchhold="onDragStart"
    @drag="onDrag"
    @drag-end="onDragEnd"
    @select="k => selectBaseItem(id, k)"
    @deselect="deselectBaseItem(id)"
    @contextmenu="onContextMenu"
  >
    <wire
      :source-value="sourceValue"
      :geometry="geometry"
      :is-selected="isSelected"
      :is-preview="isPreview"
      :flash="flash"
      :label="label"
      ref="root"
      data-test="wire"
    />
  </draggable>
</template>

<script lang="ts">
import { v4 as uuid } from 'uuid'
import { ComponentPublicInstance, defineComponent, PropType, ref, computed, watchEffect } from 'vue'
import Draggable from '@/components/interactive/Draggable.vue'
import Wire from '@/components/Wire.vue'
import { DocumentStore } from '@/store/document'
import boundaries from '@/store/document/geometry/boundaries'
import renderLayout from '@/store/document/geometry/wire'
import editorContextMenu from '@/menus/context/editor'
import Point from '@/types/interfaces/Point'
import WireGeometry from '@/types/types/WireGeometry'

export default defineComponent({
  name: 'Connection',
  components: {
    Draggable,
    Wire
  },
  props: {
    /** Whether or not this connection is selected. */
    isSelected: {
      type: Boolean,
      default: false
    },

    /** ID of the connection. */
    id: {
      type: String,
      required: true
    },

    /** CSS z-index value. */
    zIndex: {
      type: Number,
      default: 0
    },

    /** Whether or not this connection is just for previewing. */
    isPreview: {
      type: Boolean,
      default: false
    },

    /** Whether or not the item should show a flash once to the user. */
    flash: {
      type: Boolean,
      default: false
    },

    /** Document store instance. */
    store: {
      type: Function as PropType<DocumentStore>,
      required: true
    }
  },
  setup (props) {
    const store = props.store()
    const connection = ref(store.connections[props.id])
    const { source: sourceId, target: targetId } = connection.value || {}
    const sourceValue = computed(() => store.ports[sourceId].value)
    const root = ref<ComponentPublicInstance<HTMLElement>>()
    const geometry = ref<WireGeometry>()
    const position = ref<Point>({ x: 0, y: 0 })
    const label = ref('')

    watchEffect(() => {
      const source = store.ports[sourceId]
      const target = store.ports[targetId]

      if (!source || !target) return

      const topLeft = boundaries.getExtremePoint('min', source.position, target.position)

      label.value = `Connection from ${store.ports[sourceId].name} to ${store.ports[targetId].name}`
      connection.value = store.connections[props.id]
      geometry.value = renderLayout(source, target)
      position.value = {
        y: topLeft.y + geometry.value.minY,
        x: topLeft.x + geometry.value.minX
      }
    })

    const freeportId = ref<string | null>(null)

    /**
     * Mouse button down event handler.
     *
     * This will inform the component that the mouse is down and ready to create a new freeport, if it moves.
     */
    function onDragStart ({ touches }: TouchEvent) {
      createFreeport({
        x: touches[0].clientX,
        y: touches[0].clientY
      })
    }

    function createFreeport (position: Point) {
      const connection = store.connections[props.id]

      if (!root.value?.$el || connection.groupId !== null) return

      // directly change the DOM style (as opposed to using v-show/refs) to avoid "flickering" while VDOM updates
      root.value.$el.style.opacity = '0'
      freeportId.value = uuid()
      navigator.vibrate(20)

      store.createFreeport({
        itemId: freeportId.value,
        inputPortId: uuid(),
        outputPortId: uuid(),
        connectionChainId: connection.connectionChainId,
        sourceId: connection.source,
        targetId: connection.target,
        value: sourceValue.value
      })

      store.setSnapBoundaries(freeportId.value)
      store.dragItem(freeportId.value, position)
    }

    /**
     * Mouse move event handler.
     *
     * If the mouse is held down on the wire, then movement in both the x and y directions
     * will cause a new freeport to be created in that position.
     *
     * This will only create a new freeport once per mousedown-move cycle.
     */
    async function onDrag (position: Point) {
      if (!freeportId.value) {
        createFreeport(position)
      } else {
        store.dragItem(freeportId.value, position)
      }
    }

    /**
     * Mouse up event handler.
     */
    function onDragEnd () {
      if (freeportId.value) {
        // after dragging has finished, two new connections are established
        // this connection is now ready to destroy itself
        store.destroyConnection({
          source: connection.value.source,
          target: connection.value.target
        })
      }

      freeportId.value = null
    }

    function onContextMenu () {
      if (!props.isSelected) {
        store.selectBaseItem(props.id)
      }

      window.api.showContextMenu(editorContextMenu(props.store))
    }

    return {
      root,
      geometry,
      position,
      freeportId,
      sourceValue,
      label,
      onDragStart,
      onDrag,
      onDragEnd,
      onContextMenu,
      selectBaseItem: store.selectBaseItem,
      deselectBaseItem: store.deselectBaseItem
    }
  }
})
</script>
