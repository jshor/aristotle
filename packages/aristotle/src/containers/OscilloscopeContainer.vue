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
          v-for="second in waves.secondsElapsed"
          :style="{ width: '40px', minWidth: '40px' }"
          :key="second"
          class="timeline__second">
          {{ second }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OscilloscopeContainer',
  data () {
    return {
      displays: {}
    }
  },
  props: {
    waves: {
      type: Object,
      default: {}
    }
  },
  computed: {
    width () {
      return `${40 * this.waves.secondsElapsed}px`
    },
    oscillations () {
      return this.waves.waves
      // const displays = {}
      // const { waves } = this.waves
      // const getPoints = ({ segments }) => segments
      //     .map(({ x, y }) => `${x},${y}`)
      //     .join(' ')

      // for (let name in waves) {
      //   displays[name] = getPoints(waves[name])
      // }

      // return displays
    }
  },
  mounted () {
    this.$refs.timeline.scrollLeft = this.$refs.timeline.scrollWidth
    this.scrollToNextInterval()
  },
  methods: {
    scrollToNextInterval () {
      setTimeout(() => {
        this.$refs.timeline.scrollLeft += 40
      })
    }
  },
  watch: {
    waves: {
      handler () {
        const { scrollLeft, offsetWidth, scrollWidth } = this.$refs.timeline

        if (Math.abs(scrollLeft + offsetWidth - scrollWidth) <= 40) {
          this.scrollToNextInterval()
        }
      },
      deep: true
    }
  }
}
</script>

<style lang="scss">
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
  overflow-x: scroll;
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