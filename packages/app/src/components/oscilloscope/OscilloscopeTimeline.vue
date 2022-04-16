<template>
  <div class="oscilloscope-timeline">
    <div
      class="oscilloscope-timeline__list"
      ref="list"
    >
      <div
        v-for="(v, key) in oscillogram"
        :key="key"
        :style="{ color: `hsla(${v.hue},70%,70%,0.8)` }"
        class="oscilloscope-timeline__label"
      >
        {{ key }}
      </div>
    </div>

    <div
      class="oscilloscope-timeline__display"
      ref="timeline"
    >
      <div
        v-for="(value, key) in oscillogram"
        :key="key"
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
            :stroke="`hsla(${value.hue},70%,70%,0.8)`"
            stroke-width="2"
            fill="none"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, onBeforeUnmount, onMounted, ref } from 'vue'

export default defineComponent({
  name: 'OscilloscopeTimeline',
  props: {
    /** The oscillogram displayed in the timeline. */
    oscillogram: {
      type: Object as PropType<Oscillogram>,
      required: true
    }
  },
  mounted () {
    const timeline = this.$refs.timeline as HTMLElement
    const list = this.$refs.list as HTMLElement

    this.scrollToNextInterval()

    list.addEventListener('scroll', this.onTimelineScroll)
    timeline.addEventListener('scroll', this.onTimelineScroll)
  },
  beforeUnmount () {
    const timeline = this.$refs.timeline as HTMLElement
    const list = this.$refs.list as HTMLElement

    list.removeEventListener('scroll', this.onTimelineScroll)
    timeline.removeEventListener('scroll', this.onTimelineScroll)
  },
  methods: {
    /**
     * Scrolls the timeline to the maximum x value.
     */
    scrollToNextInterval () {
      const timeline = this.$refs.timeline as HTMLElement

      timeline.scrollLeft = timeline.scrollWidth
    },

    /**
     * Ensures the timeline and label list vertically scroll together.
     */
    onTimelineScroll () {
      const list = this.$refs.list as HTMLElement
      const timeline = this.$refs.timeline as HTMLElement

      if (!timeline) return

      list.scrollTop = timeline.scrollTop
      timeline.scrollTop = list.scrollTop
    }
  },
  watch: {
    oscillogram: {
      handler () {
        this.scrollToNextInterval()
      },
      deep: true
    }
  }
})
</script>

<style lang="scss">
// background colors
$color-bg-primary: #1D1E25;
$color-bg-secondary: #333641;
$color-bg-tertiary: #3D404B;
$color-bg-quaternary: #454857;

// foreground colors
$color-primary: #fff;
$color-secondary: #9ca0b1;
$color-shadow: #000;

.oscilloscope-timeline {
  background-color: $color-bg-primary;
  height: 100%;
  width: 100%;
  text-align: right;
  display: flex;
  color: #fff;
  box-sizing: border-box;
  height: calc(100% - 2.5em);

  &__list {
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__list, &__display {
    overflow: overlay;
    height: 100%;
    box-sizing: border-box;
  }

  &__label {
    padding: 0 0.5em;
    border-top: 1px solid $color-bg-tertiary;
    box-sizing: border-box;
    text-align: right;
    flex: 1;
    display: flex;
    align-items: center;
    min-height: 40px;
  }

  &__display {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
  }

  &__svg {
    border-top: 1px solid $color-bg-tertiary;
    min-width: 100%;
    text-align: left;
    min-height: 40px;
    flex: 1;
    background-attachment: scroll;
    padding: 5px 0;
    box-sizing: border-box;
    margin-left: -2px;

    svg {
      height: 100%;
    }
  }
}
</style>
