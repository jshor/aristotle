<template>
  <div
    class="input-switch"
    :class="{
      'input-switch--on': value === 1,
      'input-switch--high-z': value === 0
    }"
    @click="click"
  />
</template>

<script type="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'InputSwitch',
  props: {
    value: {
      type: Number,
      default: 0
    }
  },
  methods: {
    click () {
      this.$emit('toggle', this.value === 1 ? -1 : 1)
    }
  }
})
</script>

<style lang="scss">
.input-switch {
  width: 40px;
  height: 40px;
  border: 1px solid #000;
  background-color: gray;
  cursor: pointer;
  pointer-events: all;

  &--on {
    background-color: green;
  }

  &--high-z {
    background-color: darkred;
  }
}
</style>
