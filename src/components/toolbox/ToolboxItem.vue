<template>
  <draggable
    class="toolbox-item"
    :tabindex="0"
    @drag-start="onDragStart"
    @drag="onDrag"
    @drag-end="onDragEnd"
    @click="$emit('drop', factory)"
  >
    <div class="toolbox-item__parent">
      <resizable
        class="toolbox-item__preview"
        ref="preview"
        @resize="rect => previewRect = rect"
      >
        <resizable
          class="toolbox-item__inner"
          ref="selectable"
          :style="{ zoom }"
          @resize="rect => selectableRect = rect"
        >
          <circuit-component
            :type="item.type"
            :subtype="item.subtype"
            :ports="ports"
            :properties="item.properties"
          />
        </resizable>
      </resizable>
    </div>
    <div class="toolbox-item__label">
      {{ item.subtype }}
    </div>
  </draggable>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, ComponentPublicInstance } from 'vue'
import CircuitComponent from '../item/CircuitComponent.vue'
import Draggable from '../interactive/Draggable.vue'
import Resizable from '../interactive/Resizable.vue'

export default defineComponent({
  name: 'ToolboxItem',
  components: {
    CircuitComponent,
    Draggable,
    Resizable
},
  emits: {
    drop: (f: ItemFactory, p?: Point) => true
  },
  props: {
    /** User-friendly label. */
    factory: {
      type: Function as PropType<ItemFactory>,
      required: true
    },
    /** Current canvas zoom level. */
    zoom: {
      type: Number,
      default: 1
    }
  },
  setup (props, { emit }) {
    const selectable = ref<ComponentPublicInstance<HTMLElement>>()
    const selectableRect = ref(new DOMRect())
    const previewRect = ref(new DOMRect())
    const zoom = ref(1)
    const { item, ports } = props.factory()

    let draggedElement: HTMLElement | null = null

    /**
     * Resize event handler.
     * This will update the zoom level of the displayed item such that it fits in the parent (if smaller).
     */
    function onSizeChanged () {
      const inner = selectableRect.value
      const outer = previewRect.value
      const ratio = Math.max(inner.width / outer.width, inner.height / outer.height)

      zoom.value = Math.min(1 / ratio, 1)
    }

    /**
     * Mouse down event handler.
     * Begins the dragging session.
     */
    function onDragStart () {
      const inner = selectableRect.value

      draggedElement = selectable.value?.$el.cloneNode(true) as HTMLElement
      draggedElement.style.position = 'absolute'
      draggedElement.style['zoom' as any] = `${props.zoom}`
      draggedElement.style.width = `${inner.width}px`
      draggedElement.style.height = `${inner.height}px`
    }

    /**
     * Mouse move event handler.
     */
    function onDrag ({ x, y }: Point) {
      if (!draggedElement) return

      if (!document.body.contains(draggedElement)) {
        document.body.appendChild(draggedElement)
      }

      const { width, height } = draggedElement.getBoundingClientRect()

      draggedElement.style.left = `${(x - ((width / 2) * props.zoom)) / props.zoom}px`
      draggedElement.style.top = `${(y - ((height / 2) * props.zoom)) / props.zoom}px`
    }

    /**
     * Mouse button release event handler.
     *
     * @emits drop when the toolbox item has been dragged out of the box, or clicked on
     */
    function onDragEnd (position: Point) {
      if (!draggedElement) return
      if (!document.body.contains(draggedElement)) return

      draggedElement.remove()
      draggedElement = null

      emit('drop', props.factory, position)
    }

    return {
      onDragStart,
      onDrag,
      onDragEnd,
      onSizeChanged,
      item,
      ports,
      zoom,
      selectable,
      selectableRect,
      previewRect
    }
  }
})
</script>

<style lang="scss">
.toolbox-item {
  position: relative;
  display: inline-block;
  pointer-events: all;
  touch-action: auto;
  aspect-ratio: 0.75;
  width: 8vh;
  max-height: 100%;

  &:hover {
    background-color: var(--color-bg-secondary);
  }

  &:active {
    background-color: var(--color-bg-tertiary);
  }

  &__parent {
    overflow: hidden;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1em;
    box-sizing: border-box;
    aspect-ratio: 1;
  }

  &__preview {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
  }

  &__inner {
    display: inline-block;
    position: relative;
  }

  &__label {
    padding: 1em;
    padding-top: 0;
    text-align: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>
