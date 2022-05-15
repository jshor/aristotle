<template>
  <div class="toolbox-item"
    :tabindex="0"
    @mousedown="onMouseDown"
  >
    <div class="toolbox-item__parent">
      <div
        class="toolbox-item__preview"
        ref="preview"
      >
        <div
          class="toolbox-item__inner"
          ref="selectable"
          :style="{ zoom }"
        >
          <slot />
          <port-set>
            <template
              v-for="(count, orientation) in portCounts"
              v-slot:[orientation]
            >
              <port-pivot
                v-for="i in count"
                :key="`${orientation}_${count}`"
                :type="1"
              >
                <port-handle />
              </port-pivot>
            </template>
          </port-set>
        </div>
      </div>
    </div>
    <div class="toolbox-item__label">
      {{ label }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeMount, ref } from 'vue'
import ResizeObserver from 'resize-observer-polyfill'
import PortHandle from '@/components/PortHandle.vue'
import PortSet from '@/components/item/PortSet.vue'
import PortPivot from '@/components/PortPivot.vue'

export default defineComponent({
  name: 'preview',
  components: {
    PortHandle,
    PortSet,
    PortPivot
  },
  props: {
    /** Number of ports to display on the left. */
    leftPortCount: {
      type: Number,
      default: 0
    },
    /** Number of ports to display on the top. */
    topPortCount: {
      type: Number,
      default: 0
    },
    /** Number of ports to display on the right. */
    rightPortCount: {
      type: Number,
      default: 0
    },
    /** Number of ports to display on the bottom. */
    bottomPortCount: {
      type: Number,
      default: 0
    },
    /** User-friendly label. */
    label: {
      type: String,
      required: true
    },
    /** Current canvas zoom level. */
    zoom: {
      type: Number,
      default: 1
    }
  },
  setup (props, { emit }) {
    const selectable = ref<HTMLElement>()
    const preview = ref<HTMLElement>()
    const zoom = ref(1)
    const portCounts = {
      left: props.leftPortCount,
      top: props.topPortCount,
      right: props.rightPortCount,
      bottom: props.bottomPortCount
    }

    let draggedElement: HTMLElement | null = null
    let draggedPoint: Point = { x: 0, y: 0 }

    /**
     * Resize event handler.
     * This will update the zoom level of the displayed item such that it fits in the parent (if smaller).
     */
    function onSizeChanged () {
      if (selectable.value && preview.value) {
        const inner = selectable.value.getBoundingClientRect()
        const outer = preview.value.getBoundingClientRect()
        const ratio = Math.max(inner.width / outer.width, inner.height / outer.height)

        zoom.value = Math.min(1 / ratio, 1)
      }
    }

    /**
     * Mouse down event handler.
     * Begins the dragging session.
     */
    function onMouseDown ($event: MouseEvent) {
      if (!selectable.value) return

      const inner = selectable.value.getBoundingClientRect()

      draggedElement = selectable.value.cloneNode(true) as HTMLElement
      draggedElement.style.position = 'absolute'
      draggedElement.style['zoom'] = `${props.zoom}`
      draggedElement.style.width = `${inner.width}px`
      draggedElement.style.height = `${inner.height}px`

      draggedPoint = $event
    }

    /**
     * Mouse move event handler.
     */
    function onMouseMove ($event: MouseEvent) {
      if (!draggedElement) return

      const eventX = $event.clientX
      const eventY = $event.clientY
      const deltaX = Math.abs(draggedPoint.x - eventX)
      const deltaY = Math.abs(draggedPoint.y - eventY)

      if (deltaX + deltaY < 4) {
        // if the mouse has not moved at least two pixels, then don't start the dragging process
        return
      }

      if (!document.body.contains(draggedElement)) {
        document.body.appendChild(draggedElement)
      }

      const { width, height } = draggedElement.getBoundingClientRect()

      draggedElement.style.left = `${(eventX - ((width / 2) * props.zoom)) / props.zoom}px`
      draggedElement.style.top = `${(eventY - ((height / 2) * props.zoom)) / props.zoom}px`
    }

    /**
     * Mouse button release event handler.
     *
     * @emits drop when the toolbox item has been dragged out of the box, or clicked on
     */
    function onMouseUp () {
      if (!draggedElement) return
      if (!document.body.contains(draggedElement)) emit('drop')

      const { x, y } = draggedElement.getBoundingClientRect()

      draggedElement.remove()
      draggedElement = null

      emit('drop', {
        x: x * props.zoom,
        y: y * props.zoom
      })
    }

    const observer = new ResizeObserver(onSizeChanged)

    onMounted(() => {
      if (preview.value) {
        observer.observe(preview.value)
      }

      if (selectable.value) {
        observer.observe(selectable.value)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      // window.addEventListener('keydown', onMouseUp)
    })

    onBeforeMount(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      // window.removeEventListener('keydown', onMouseUp)
    })

    return {
      portCounts,
      onMouseDown,
      onSizeChanged,
      zoom,
      selectable,
      preview
    }
  }
})
</script>

<style lang="scss">
.toolbox-item {
  width: 50%;
  display: inline-block;

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
