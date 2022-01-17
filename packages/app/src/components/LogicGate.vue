<template>
  <div class="logic-gate" :style="{ width: `${width}px` }">
    <button @click="resize">Resize</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'LogicGate',
  data () {
    return {
      rotation: 0,
      width: 100
    }
  },
  methods: {
    resize ($event: MouseEvent) {
      this.width = this.width === 100 ? 130 : 100
      $event.preventDefault()
      $event.stopPropagation()
    }
  }
})
</script>

<style lang="scss">
.logic-gate {
  background-color: rgba(0, 255, 122, 1);
  border: 1px solid black;
  box-sizing: border-box;
  width: 100px;
  height: 150px;
  position: relative;
  top: 0;
  left: 0;
}
</style>
