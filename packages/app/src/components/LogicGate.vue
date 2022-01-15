<template>
  <div class="logic-gate">
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'LogicGate'
})
</script>

<style lang="scss">
.logic-gate {
  background-color: rgba(0, 255, 122, 1);
  border: 1px solid black;
  width: 100px;
  height: 185px;
  position: relative;
  top: 0;
  left: 0;
}
</style>
