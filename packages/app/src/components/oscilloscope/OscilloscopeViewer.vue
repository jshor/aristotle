<template>
  <div class="oscilloscope-outer">

    <div class="oscilloscope-action-bar">
      <div class="oscilloscope-action-bar__title">Oscilloscope</div>
      <div class="oscilloscope-action-bar__actions">
        <div
          role="button"
          class="oscilloscope-action-bar__button"
        >
          <icon :icon="faBan" />
        </div>
        <div
          role="button"
          class="oscilloscope-action-bar__button"
        >
          <icon :icon="faClose" />
        </div>
      </div>
    </div>


    <div
      v-if="hasWaves"
      class="oscilloscope"
    >
      <div class="oscilloscope-list" ref="list">
        <div
          v-for="(v, key) in oscillations"
          :key="key"
          :style="{ color: `hsla(${v.hue},70%,70%,0.8)` }"
          class="oscilloscope-list__item">
          {{ key }}
        </div>
      </div>
      <div class="binary-wave" ref="timeline"
          :style="{ width }">
        <div
          v-for="(value, key) in oscillations"
          :key="key"
          :style="{ width }"
          class="binary-wave__svg">
          <svg
            :width="value.width"
            :viewBox="`0 0 ${value.width} 2`"
            preserveAspectRatio="none">
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
    <div
      v-else
      class="oscilloscope"
    >
      No elements to observe.
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { faArrowRightToBracket, faBan, faClose } from '@fortawesome/free-solid-svg-icons'
import Icon from '@/components/Icon.vue'

export default defineComponent({
  name: 'OscilloscopeViewer',
  components: {
    Icon
  },
  data () {
    return {
      displays: {},
      faArrowRightToBracket,
      faBan,
      faClose
    }
  },
  props: {
    oscilloscope: {
      type: Object as PropType<OscilloscopeInfo>,
      default: () => ({
        waves: {},
        secondsElapsed: 0,
        secondsOffset: 0
      })
    }
  },
  computed: {
    width () {
      return `${40 * (this.oscilloscope.secondsElapsed - this.oscilloscope.secondsOffset)}px`
    },
    oscillations () {
      return this.oscilloscope.waves
    },
    hasWaves () {
      return Object.keys(this.oscillations).length > 0
    }
  },
  mounted () {
    if (!this.hasWaves) return
    const timeline = this.$refs.timeline as HTMLElement
    const list = this.$refs.list as HTMLElement

    this.scrollToNextInterval()

    list.addEventListener('scroll', this.onTimelineScroll)
    timeline.addEventListener('scroll', this.onTimelineScroll)
  },
  beforeDestroy () {
    const timeline = this.$refs.timeline as HTMLElement
    const list = this.$refs.list as HTMLElement

    list.removeEventListener('scroll', this.onTimelineScroll)
    timeline.removeEventListener('scroll', this.onTimelineScroll)
  },
  methods: {
    scrollToNextInterval () {
      const timeline = this.$refs.timeline as HTMLElement

      timeline.scrollLeft = timeline.scrollWidth
    },
    onTimelineScroll () {
      const list = this.$refs.list as HTMLElement
      const timeline = this.$refs.timeline as HTMLElement

      list.scrollTop = timeline.scrollTop
      timeline.scrollTop = list.scrollTop
    }
  },
  watch: {
    oscilloscope: {
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

.oscilloscope-outer {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
}

.oscilloscope-action-bar {
  display: flex;
  box-sizing: border-box;
  height: 2.5em;

  &__actions {
    flex: 1;
    justify-content: flex-end;
    display: flex;
  }

  &__title {
    padding: 0.5em;
  }

  &__button {
    color: $color-primary;
    background-color: transparent;
    border-radius: 2px;
    padding: 0.5em;
    box-sizing: border-box;
    height: 2.5em;
    width: 2.5em;
    text-align: center;

    &:hover {
      background-color: $color-bg-quaternary;
    }
  }
}

.oscilloscope {
  background-color: $color-bg-primary;
  height: 100%;
  width: 100%;
  text-align: right;
  display: flex;
  color: #fff;
  box-sizing: border-box;
  height: calc(100% - 2.5em);
}

.oscilloscope-list, .binary-wave {
  overflow: overlay;
  height: 100%;
  box-sizing: border-box;
}

.oscilloscope-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;

  &__item {
    padding: 0 0.5em;
    border-top: 1px solid $color-bg-tertiary;
    box-sizing: border-box;
    text-align: right;
    flex: 1;
    display: flex;
    align-items: center;
    min-height: 40px;
  }

  &::-webkit-scrollbar {
    display: none;
  }
}

.binary-wave {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;

  &__svg {
    background-size: 40px 3px;
    background-image: linear-gradient(to right, $color-bg-tertiary 1px, transparent 0px);
    border-top: 1px solid $color-bg-tertiary;
    min-width: 100%;
    text-align: left;
    min-height: 40px;
    flex: 1;
    background-attachment: scroll;
    padding: 5px 0;
    box-sizing: border-box;

    svg {
      height: 100%;
    }
  }
}

.timeline {
  color: $color-secondary;
  display: flex;
  padding-left: 20px;
  justify-content: flex-end;
  width: 100%;

  &__second {
    box-sizing: border-box;
    // border: 1px solid red;
    text-align: center;
  }
}
</style>
