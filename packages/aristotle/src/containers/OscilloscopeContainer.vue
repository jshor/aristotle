<template>
  <div>
    <div v-for="(value, key) in oscillations" :key="key">
      <svg width="2000" height="40">
        <polyline :points="value" stroke="#ffffff" stroke-width="2" fill="none" />
      </svg>
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
    oscillations () {
      const displays = {}
      const getPoints = ({ segments }) => segments
          .map(({ x, y }) => `${x},${y}`)
          .join(' ')

      for (let name in this.waves) {
        displays[name] = getPoints(this.waves[name])
      }

      return displays
    }
  }
}
</script>

<style lang="scss">
</style>