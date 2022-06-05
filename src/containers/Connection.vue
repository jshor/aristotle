<template>
  <draggable
    :style="{ zIndex }"
    :position="position"
    :is-selected="isSelected"
    @drag-start="onDragStart"
    @drag="onDrag"
    @drag-end="onDragEnd"
    @select="k => selectItem(id, k)"
    @deselect="deselectItem(id)"
  >
    <wire
      :source="source"
      :target="target"
      :geometry="geometry"
      :is-selected="isSelected"
      :is-preview="isPreview"
      :flash="flash"
      :label="'TODO'"
      ref="root"
      data-test="wire"
    />
  </draggable>
</template>

<script lang="ts">
import { v4 as uuid } from 'uuid'
import { ComponentPublicInstance, defineComponent, PropType, ref, computed } from 'vue'
import Draggable from '@/components/interactive/Draggable.vue'
import Wire from '@/components/Wire.vue'
import { DocumentStore } from '@/store/document'
import boundaries from '@/store/document/geometry/boundaries'
import renderLayout from '@/store/document/geometry/wire'

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
    const root = ref<ComponentPublicInstance<HTMLElement>>()

    const source = computed(() => store.ports[connection.value.source])
    const target = computed(() => store.ports[connection.value.target])
    const topLeft = computed(() => {
      return boundaries.getExtremePoint('min', source.value.position, target.value.position)
    })
    const geometry = computed(() => renderLayout(source.value, target.value))
    const position = computed(() => ({
      y: topLeft.value.y + geometry.value.minY,
      x: topLeft.value.x + geometry.value.minX
    }))

    let freeportId: string | null = null

    /**
     * Mouse button down event handler.
     *
     * This will inform the component that the mouse is down and ready to create a new freeport, if it moves.
     */
    function onDragStart () {
      if (connection.value.groupId !== null) return
      freeportId = null
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
      if (!root.value?.$el) return
      if (freeportId === null) {
        // directly change the DOM style (as opposed to using v-show/refs) to avoid "flickering" while VDOM updates
        root.value.$el.style.opacity = '0'
        freeportId = uuid()

        store.createFreeport({
          itemId: freeportId,
          // value: source.value.value,
          inputPortId: uuid(),
          outputPortId: uuid(),
          connectionChainId: connection.value.connectionChainId,
          // value: source.value.value,
          sourceId: source.value.id,
          targetId: target.value.id
        })
        store.setSnapBoundaries(freeportId)
      }

      store.dragItem(freeportId, position)
    }

    /**
     * Mouse up event handler.
     */
    function onDragEnd () {
      if (freeportId) {
        // after dragging has finished, two new connections are established
        // this connection is now ready to destroy itself
        store.destroyConnection({
          source: connection.value.source,
          target: connection.value.target
        })
      }

      freeportId = null
    }

    return {
      root,
      geometry,
      position,
      onDragStart,
      onDrag,
      onDragEnd,
      source,
      target,
      selectItem: store.selectItem,
      deselectItem: store.deselectItem
    }
  }
})
</script>
