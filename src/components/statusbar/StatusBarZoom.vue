<template>
  <input
    type="range"
    class="status-bar-zoom"
    :step="step"
    :min="min"
    :max="max"
    :value="value"
    @input="onInput"
  />
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import Icon from '@/components/Icon.vue'

export default defineComponent({
  name: 'StatusBarZoom',
  components: {
    Icon
  },
  props: {
    /** Current zoom value. */
    zoom: {
      type: Number,
      required: true
    },
    /** Minimum slider value. */
    min: {
      type: Number,
      default: 0
    },
    /** Maximum slider value. */
    max: {
      type: Number,
      default: 200
    },
    /** Slider increment value. */
    step: {
      type: Number,
      default: 10
    }
  },
  setup (props, { emit }) {
    const value = computed(() => Math.round(props.zoom * 100))

    /**
     * Slider input event handler.
     *
     * @emits zoom as a decimal percentage factor [0.0, 1.0]
     */
    function onInput ($event: Event) {
      const target = $event.target as HTMLInputElement
      const zoom = parseFloat(target.value)

      emit('zoom', zoom / 100)
    }

    return {
      onInput,
      value
    }
  }
})
</script>

<style lang="scss">
.status-bar-zoom {
  -webkit-appearance: none;
  height: 0.5em;
  background-color: var(--color-bg-quaternary);
  transition: opacity .2s;
  opacity: 1;

  &:hover {
    opacity: 0.7;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 0.5em;
    height: 1.5em;
    background-color: var(--color-secondary);
    cursor: ew-resize;
  }

  &::-moz-range-thumb {
    width: 0.5em;
    height: 1.5em;
    background-color: var(--color-secondary);
    cursor: ew-resize;
  }
}
</style>
