<template>
  <div class="oscilloscope-timeline">
    <div
      class="oscilloscope-timeline__list"
      ref="labelsRef"
      :style="labelsStyle"
      @scroll="onScroll"
    >
      <div
        v-for="(v, key) in oscillogram"
        :key="key"
        :style="{ color: `hsla(${v.hue}, var(--lightness), var(--saturation), 0.8)` }"
        class="oscilloscope-timeline__label"
        @contextmenu="$event => $emit('contextmenu', $event, key as string)"
      >
        <label>{{ ports[key]?.name }}</label>
      </div>
    </div>

    <div
      class="oscilloscope-timeline__touch-resizer"
      @touchstart="onDragStart"
      @touchmove="onTouchMove"
      @touchcancel="onDragEnd"
      @touchend="onDragEnd"
      @mousedown="onDragStart"
      @mouseup="onDragEnd"
    >
      <div class="oscilloscope-timeline__mouse-resizer" />
    </div>

    <div
      class="oscilloscope-timeline__display"
      ref="timelineRef"
      @wheel="onWheel"
      @scroll="onScroll"
    >
      <div
        v-for="(value, key) in oscillogram"
        :style="{ width: `${totalWidth}px` }"
        :key="key"
        class="oscilloscope-timeline__item"
        @contextmenu="$event => $emit('contextmenu', $event, key as string)"
      >
        <div
          :style="{ width: `${value.width}px` }"
          class="oscilloscope-timeline__svg"
        >
          <svg
            :width="value.width"
            :viewBox="`0 0 ${value.width} 1`"
            preserveAspectRatio="none"
          >
            <polyline
              :points="value.points"
              :stroke="`hsla(${value.hue}, var(--lightness), var(--saturation), 0.8)`"
              stroke-width="2"
              fill="none"
              vector-effect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Port from '@/types/interfaces/Port'
import Oscillogram from '@/types/types/Oscillogram'
import { computed, defineComponent, onMounted, onUnmounted, PropType, ref, StyleValue, watch } from 'vue'

export default defineComponent({
  name: 'OscilloscopeTimeline',
  emits: {
    'update:modelValue': (height: number) => true,
    'contextmenu': ($event: MouseEvent, portId: string) => true
  },
  props: {
    /** The width, in pixels, of the labels column. */
    modelValue: {
      type: Number,
      required: true
    },
    /** The oscillogram displayed in the timeline. */
    oscillogram: {
      type: Object as PropType<Oscillogram>,
      required: true
    },
    /** The oscillogram displayed in the timeline. */
    ports: {
      type: Object as PropType<Record<string, Port>>,
      required: true
    }
  },
  computed: {
    totalWidth () {
      return Object.values(this.oscillogram).reduce((w, { width }) => Math.max(width, w), 0)
    }
  },
  setup (props, { emit }) {
    const labelsWidth = ref(props.modelValue)
    const labelsRef = ref<HTMLElement>()
    const timelineRef = ref<HTMLElement>()
    const labelsStyle = computed((): StyleValue => {
      return labelsWidth.value
        ? { width: `${labelsWidth.value}px` }
        : {}
    })

    watch(() => props.oscillogram, scrollToNextInterval, { deep: true })

    let isDragging = false

    onMounted(() => {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onDragEnd)
    })

    onUnmounted(() => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onDragEnd)
    })

    function onDragStart () {
      isDragging = true
    }

    function onDragEnd () {
      isDragging = false
    }

    function onMouseMove ($event: MouseEvent | Touch) {
      if (!isDragging || !labelsRef.value) return

      const rect = labelsRef.value
        .parentElement!
        .getBoundingClientRect()

      labelsWidth.value = Math.max(50, Math.min(rect.right, $event.clientX))

      emit('update:modelValue', labelsWidth.value)
    }

    function onTouchMove ($event: TouchEvent) {
      onMouseMove($event.touches[0])
    }

    function onWheel ($event: WheelEvent) {
      if (!timelineRef.value) return

      timelineRef.value.scrollTop += $event.deltaY / 10

      $event.preventDefault()
    }

    /**
     * Scrolls the timeline to the maximum x value.
     */
    function scrollToNextInterval () {
      if (!timelineRef.value) return

      timelineRef.value.scrollLeft = timelineRef.value.scrollWidth
    }

    /**
     * Ensures the timeline and label list scroll vertically together.
     */
    function onScroll () {
      if (!labelsRef.value || !timelineRef.value) return

      labelsRef.value.scrollTop = timelineRef.value.scrollTop
    }

    return {
      labelsRef,
      timelineRef,
      labelsStyle,
      scrollToNextInterval,
      onWheel,
      onTouchMove,
      onScroll,
      onDragStart,
      onDragEnd
    }
  }
})
</script>

<style lang="scss">
.oscilloscope-timeline {
  width: 100%;
  text-align: right;
  display: flex;
  box-sizing: border-box;
  max-height: 100%;
  overflow: hidden;
  flex: 1;
  --resizer-width: #{$resizer-size};

  &__touch-resizer {
    width: var(--resizer-width);

    margin-right: calc(-1 * var(--resizer-width));
    z-index: 1000;
    height: 100%;
    background-color: transparent;
  }

  &__mouse-resizer {
    background-color: transparent;
    width: calc(var(--resizer-width) / 2);
    height: 100%;
    transition: 0.5s all;
    cursor: ew-resize;

    &:hover {
      background-color: var(--color-primary);
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__list, &__display {
    overflow: overlay;
    box-sizing: border-box;
  }

  &__label {
    padding: 0 0.5em;
    border-top: 1px solid var(--color-bg-tertiary);
    border-right: 1px solid var(--color-bg-tertiary);
    box-sizing: border-box;
    text-align: right;
    flex: 1;
    display: flex;
    align-items: center;
    min-height: 40px;

    > label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__display {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
    text-align: right;
  }

  &__item {
    border-top: 1px solid var(--color-bg-tertiary);
    box-sizing: border-box;
    min-width: 100%;
    min-height: 40px;
    height: 100%;
    text-align: right;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
  }

  &__svg {
    height: 100%;
    flex: 1;
    background-attachment: scroll;
    padding: 5px 0;
    box-sizing: border-box;
    text-align: right;

    svg {
      height: 100%;
    }
  }
}
</style>
