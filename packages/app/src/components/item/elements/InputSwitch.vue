<template>
  <div class="input-switch">
    <button
      type="button"
      class="input-switch__flipper"
      :tabindex="0"
      :class="{
        'input-switch__flipper--on': model === 1,
        'input-switch__flipper--off': model === -1,
        'input-switch__flipper--high-z': model === 0
      }"
      @mousedown.stop="click"
    >
      <span v-if="model === 1">ON</span>
      <span v-else-if="model === -1">OFF</span>
      <span v-else>?</span>
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'InputSwitch',
  props: {
    value: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      model: 0
    }
  },
  watch: {
    value: {
      handler (value) {
        this.model = value
      },
      immediate: true
    }
  },
  methods: {
    click ($event: MouseEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      this.model = this.model === 1 ? -1 : 1

      this.$emit('toggle', this.model)

      return false
    }
  }
})
</script>

<style lang="scss">
.input-switch {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-secondary);
  background-color: var(--color-bg-secondary);
  pointer-events: all;
  cursor: move;

  &__flipper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    cursor: pointer;
    border: 1px solid var(--color-secondary);
    color: #fff;
    box-sizing: border-box;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.75em;
    border-radius: 2px;

    &--on {
      background-color: var(--color-on);
      box-shadow: 0 0 20px var(--color-on);
    }

    &--off {
      background-color: var(--color-off);
    }

    &--high-z {
      background-color: var(--color-hi-z);
    }
  }
}
</style>
