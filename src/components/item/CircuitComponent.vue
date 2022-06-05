<template>
  <div
    class="circuit-component"
    :class="{
      'circuit-component--selected': isSelected,
      'circuit-component--flash': flash
    }"
  >
    <component
      v-bind:is="type"
      v-bind="$props"
      @change="onChange"
    />
    <div
      v-for="(name, index) in ['left', 'top', 'right', 'bottom']"
      :key="index"
      :class="`circuit-component__ports circuit-component__ports--${name}`"
    >
      <slot :name="index" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import Freeport from '@/components/item/Freeport.vue'
import InputNode from '@/components/item/elements/InputNode.vue'
import IntegratedCircuit from '@/components/item/elements/IntegratedCircuit.vue'
import LogicGate from '@/components/item/elements/LogicGate.vue'
import OutputNode from '@/components/item/elements/OutputNode.vue'
import ItemType from '@/types/enums/ItemType'
import ItemSubtype from '@/types/enums/ItemSubtype'

const components = {
  Freeport,
  InputNode,
  IntegratedCircuit,
  LogicGate,
  OutputNode
}

export default defineComponent({
  name: 'CircuitComponent',
  components,
  emits: {
    change: (data: { id: string, value: number }) => true
  },
  props: {
    isSelected: {
      type: Boolean,
      default: false
    },
    flash: {
      type: Boolean,
      default: false
    },
    type: {
      type: String as PropType<ItemType>,
      required: true
    },
    subtype: {
      type: String,
      required: true
    },
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    },
    properties: {
      type: Object as PropType<PropertySet>,
      default: () => ({})
    }
  },
  setup (_, { emit }) {
    return {
      onChange (args: { id: string, value: number }) {
        emit('change', args)
      }
    }
  }
})
</script>

<style lang="scss">
.circuit-component {
  outline: none;

  &__ports {
    position: relative;
    display: flex;
    position: absolute;

    &--left, &--right {
      left: 0;
      top: 0;
      bottom: 0;
      right: 0;
      width: 50%;
      flex-direction: column;
      justify-content: space-around;
    }

    &--bottom, &--top {
      flex: 1;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      height: 50%;
      justify-content: center;
      align-items: center;
      justify-content: space-around;
    }

    &--right {
      left: 50%;
    }

    &--bottom {
      top: 50%;
    }

    &--bottom, &--right {
      align-items: flex-end;
      flex-direction: column-reverse;
    }

    &--top {
      bottom: 50%;
      align-items: flex-start;
    }
  }

  &--selected {
    filter: drop-shadow(0 0 6px var(--color-secondary));
  }

  &--flash {
    animation: flash 1s normal ease-out;
  }
}

@keyframes flash {
  0% {
    filter: inherit;
  }
  50% {
    filter: drop-shadow(0px 0px 20px var(--color-secondary));
  }
  100% {
    filter: inherit;
  }
}
</style>
