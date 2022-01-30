<template>
  <div class="oscilloscope">
    <div class="oscilloscope-list">
      <div
        v-for="(v, key) in oscillations"
        :key="key"
        class="oscilloscope-list__item">
        {{ key }}
      </div>
      <div class="oscilloscope-list__item">Elapsed (s)</div>
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
            stroke="#ffffff"
            stroke-width="2"
            fill="none"
            vector-effect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div
        :style="{ width }"
        class="timeline">
        <div
          v-for="second in (waves.secondsElapsed - waves.secondsOffset)"
          :style="{ width: '40px', minWidth: '40px' }"
          :key="second"
          class="timeline__second">
          {{ waves.secondsOffset + second }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'Oscilloscope',
  data () {
    return {
      displays: {}
    }
  },
  props: {
    waves: {
      type: Object,
      default: () => ({
        waves: {},
        secondsElapsed: 0,
        secondsOffset: 0
      })
    }
  },
  computed: {
    width () {
      return `${40 * (this.waves.secondsElapsed - this.waves.secondsOffset)}px`
    },
    oscillations () {
      return this.waves.waves
    }
  },
  mounted () {
    const timeline = this.$refs.timeline as HTMLElement
    timeline.scrollLeft = timeline.scrollWidth
    this.scrollToNextInterval()
  },
  methods: {
    scrollToNextInterval () {
      setTimeout(() => {
        (this.$refs.timeline as HTMLElement).scrollLeft += 40
      })
    }
  },
  watch: {
    waves: {
      handler () {
        const { scrollLeft, offsetWidth, scrollWidth } = this.$refs.timeline as HTMLElement

        if (Math.abs(scrollLeft + offsetWidth - scrollWidth) <= 40) {
          this.scrollToNextInterval()
        }
      },
      deep: true
    }
  }
})
</script>

<style lang="scss">
$color-bg-primary: #000;
$color-bg-tertiary: #808080;
$color-bg-secondary: #e8e8e8;
$color-secondary: #c0c0c0;

.oscilloscope {
  background-color: $color-bg-primary;
  height: 100%;
  width: 100%;
  text-align: right;
  display: flex;
}

.oscilloscope-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 0.5em;

  &__item {
    text-align: right;
    color: #fff;
    flex: 1;
    display: flex;
    align-items: center;

    &:last-of-type {
      color: $color-secondary;
      text-align: right;
      justify-content: flex-end;
      flex: 0;
    }
  }
}

.binary-wave {
  flex: 1;
  // overflow-x: scroll;
  position: relative;
  display: flex;
  flex-direction: column;

  &__svg {
    flex: 1;
    background-attachment: scroll;
    background-size: 40px 40px;
    background-image: linear-gradient(to right, $color-bg-tertiary 1px, transparent 1px);
    padding: 5px 0;

    svg {
      height: 100%;
    }
  }
}

body, html {

    height: auto;
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
