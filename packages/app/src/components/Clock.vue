<template>
  <div class="input-switch">
    <div
      class="input-switch__flipper"
      :class="{
        'input-switch__flipper--on': value === 1,
        'input-switch__flipper--off': value === -1,
        'input-switch__flipper--high-z': value === 0
      }"
      @mousedown.stop="click"
    >
      <span>___</span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Clock',
  props: {
    value: {
      type: Number,
      default: 0
    }
  },
  methods: {
    click ($event: MouseEvent) {
      $event.preventDefault()
      $event.stopPropagation()

      this.$emit('toggle', this.value === 1 ? -1 : 1)

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
  border: 1px solid #000;
  background-color: peachpuff;
  pointer-events: all;
  cursor: move;

  &__flipper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    cursor: pointer;
    border: 1px solid #000;
    color: #fff;
    box-sizing: border-box;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.75em;
    border-radius: 2px;

    &--on {
      background-color: green;
      box-shadow: 0 0 20px green;
      transform: scaleY(-1);
    }

    &--off {
      background-color: gray;
    }

    &--high-z {
      background-color: darkred;
    }
  }
}
</style>
