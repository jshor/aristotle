<template>
  <div class="oscilloscope">
    <div class="oscilloscope__list">
      <span>testIt</span>
    </div>
    <div class="oscilloscope__inner" ref="timeline" 
        :style="{ width }">
      <div
        v-for="(value, key) in oscillations"
        :key="key"
        :style="{ width }"
        class="oscilloscope__wave">
        <svg
          :width="width"
          :viewBox="`0 0 ${width.replace('px', '')} 2`"
          preserveAspectRatio="none">
          <polyline
            :points="value"
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
  watch: {
    waves: {
      handler () {
        const { scrollLeft, offsetWidth, scrollWidth } = this.$refs.timeline

        if (Math.abs(scrollLeft + offsetWidth - scrollWidth) <= 42) {
          setTimeout(() => {
            this.$refs.timeline.scrollLeft += 40
          })
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

  &__list {
    width: 60px;
  }

  &__inner {
    flex: 1;
    overflow-x: scroll;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  &__wave {
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