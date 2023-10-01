<template>
  <div
    :style="{ height: `${(25 * inputCount)}px` }"
    class="logic-gate"
  >
    <div
      :style="{
        width: (inputCount > 2 ? 100 : 100) + '%'
      }"
      class="logic-gate__wires"
    >
      <div
        :class="{
          'logic-gate__wires-divider--multiwire': inputCount > 2
        }"
        class="logic-gate__wires-divider"
      >
        <div
          v-for="index in inputCount - 1"
          :key="index"
          class="logic-gate__wire"
        />
        <div class="logic-gate__wire">
        </div>
      </div>
      <div
        v-if="inputCount > 2"
        class="logic-gate__wires--multiwire"
      />
      <div class="logic-gate__wires-divider">
        <div class="logic-gate__wire">
        </div>
      </div>
    </div>
    <component
      v-bind:is="subtype"
      class="logic-gate__component"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import And from './gates/And.vue'
import Or from './gates/Or.vue'
import Nor from './gates/Nor.vue'
import Not from './gates/Not.vue'
import Nand from './gates/Nand.vue'
import Xnor from './gates/Xnor.vue'
import Xor from './gates/Xor.vue'
import ItemSubtype from '@/types/enums/ItemSubtype'
import ItemProperties from '@/types/interfaces/ItemProperties'

export default defineComponent({
  name: 'LogicGate',
  components: {
    And,
    Or,
    Nor,
    Not,
    Nand,
    Xnor,
    Xor
  },
  props: {
    properties: {
      type: Object as PropType<ItemProperties>,
      default: () => ({})
    },
    subtype: {
      subtype: String as PropType<ItemSubtype>,
      required: true
    }
  },
  setup (props) {
    const inputCount = computed(() => props.properties.inputCount?.value || 2)

    return {
      inputCount
    }
  }
})
</script>

<style lang="scss">
.logic-gate {
  width: 140px;
  position: relative;
  pointer-events: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &__component {
    position: absolute;
  }

  &__wire {
    height: 2px;
    background-color: var(--color-secondary);
  }

  &__wires {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;

    &--multiwire {
      background-color: var(--color-secondary);
      width: 2px;
      height: calc(100% - 22px);
      margin-top: 11px;
    }
  }

  &__wires-divider {
    height: 100%;
    width: 50%;
    display: flex;
    justify-content: space-around;
    flex-direction: column;
    flex: 1;

    &--multiwire {
      flex: initial;
      width: 15%;
    }
  }
}
</style>
