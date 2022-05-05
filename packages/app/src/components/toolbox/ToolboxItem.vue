<template>
  <div class="toolbox-item"
    :tabindex="0"
    @mousedown="onMouseDown"
  >
    <div class="toolbox-entry">
      <div class="toolbox-entry__preview" ref="toolboxItem">
        <div class="toolbox-entry__inner" ref="selectable" :style="{ zoom }">
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
import { defineComponent, onMounted, onBeforeMount, PropType, ref } from 'vue'
import ResizeObserver from 'resize-observer-polyfill'
import PortHandle from '@/components/PortHandle.vue'
import PortSet from '@/components/item/PortSet.vue'
import PortPivot from '@/components/PortPivot.vue'

export default defineComponent({
  name: 'ToolboxItem',
  components: {
    PortHandle,
    PortSet,
    PortPivot
  },
  props: {
    leftPortCount: {
      type: Number,
      default: 0
    },
    topPortCount: {
      type: Number,
      default: 0
    },
    rightPortCount: {
      type: Number,
      default: 0
    },
    bottomPortCount: {
      type: Number,
      default: 0
    },
    label: {
      type: String,
      required: true
    },
    zoom: {
      type: Number,
      default: 1
    }
  },
  setup (props, { emit }) {
    const selectable = ref<HTMLElement>()
    const toolboxItem = ref<HTMLElement>()
    const zoom = ref(1)
    const portCounts = {
      left: props.leftPortCount,
      top: props.topPortCount,
      right: props.rightPortCount,
      bottom: props.bottomPortCount
    }

    let draggedElement: HTMLElement | null = null
    let draggedPoint: Point = { x: 0, y: 0 }

    function onSizeChanged () {
      if (selectable.value && toolboxItem.value) {
        const inner = selectable.value.getBoundingClientRect()
        const outer = toolboxItem.value.getBoundingClientRect()
        const ratio = Math.max(inner.width / outer.width, inner.height / outer.height)

        zoom.value = Math.min(1 / ratio, 1)
      }
    }

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

    function onMouseMove ($event: MouseEvent) {
      if (!draggedElement) return

      const deltaX = Math.abs(draggedPoint.x - $event.x)
      const deltaY = Math.abs(draggedPoint.y - $event.y)

      if (deltaX + deltaY < 4) {
        // if the mouse has not moved at least two pixels, then don't start the dragging process
        return
      }

      if (!document.body.contains(draggedElement)) {
        document.body.appendChild(draggedElement)
      }

      const { width, height } = draggedElement.getBoundingClientRect()

      draggedElement.style.left = `${($event.x - ((width / 2) * props.zoom)) / props.zoom}px`
      draggedElement.style.top = `${($event.y - ((height / 2) * props.zoom)) / props.zoom}px`
    }

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
      if (toolboxItem.value) {
        observer.observe(toolboxItem.value)
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
      zoom,
      selectable,
      toolboxItem
    }
  }
})
</script>

<style lang="scss">
.toolbox-entry {
  overflow: hidden;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1em;
  box-sizing: border-box;
  aspect-ratio: 1;

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
}

.toolbox-item {
  width: 50%;
  display: inline-block;

  &:hover {
    background-color: $color-bg-secondary;
  }

  &:active {
    background-color: $color-bg-tertiary;
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
