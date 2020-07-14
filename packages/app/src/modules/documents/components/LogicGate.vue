<template>
  <div class="logic-gate">
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class LogicGate extends Vue {
}
</script>

<style lang="scss">
.logic-gate {
  background-color: rgba(0, 255, 122, 0.2);
  border: 1px solid black;
  width: 100px;
  height: 185px;
  position: relative;
  top: 0;
  left: 0;
}
</style>
