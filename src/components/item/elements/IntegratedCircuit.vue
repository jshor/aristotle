<template>
  <div class="integrated-circuit">
    <div class="integrated-circuit__wires">
      <div class="integrated-circuit__wires-divider">
        <div
          v-for="port in ports.filter(p => p.orientation === 0)"
          :key="port.id"
          class="integrated-circuit__wire"
        />
      </div>
      <div class="integrated-circuit__wires-divider">
        <div
          v-for="port in ports.filter(p => p.orientation === 2)"
          :key="port.id"
          class="integrated-circuit__wire"
        />
      </div>
    </div>
    <div class="integrated-circuit__box">
      <div class="integrated-circuit__box-inner">
        R-S Flip-Flop
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'IntegratedCircuit',
  props: {
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    }
  }
})
</script>

<style lang="scss">
.integrated-circuit {
  height: 150px;
  width: 200px;
  pointer-events: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &__box {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__box-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg-secondary);
    border: 2px solid var(--color-secondary);
    height: 100%;
    width: 150px;
    pointer-events: all;
  }

  &__wire {
    height: 3px;
    background-color: var(--color-secondary);
  }

  &__wires {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
  }

  &__wires-divider {
    height: 100%;
    width: 50%;
    display: flex;
    justify-content: space-around;
    flex-direction: column;
  }
}
</style>
