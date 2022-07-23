<template>
  <div
    class="circuit-component"
    :class="{
      'circuit-component--selected': isSelected,
      'circuit-component--flash': flash,
      'circuit-component--custom': subtype === ItemSubtype.CustomCircuit
    }"
    :title="name"
  >
    <component
      v-bind:is="type"
      v-bind="$props"
      @signal="onChange"
    />
    <template v-if="type !== ItemType.Freeport">
      <div
        v-for="(name, index) in ['left', 'top', 'right', 'bottom']"
        :key="index"
        :class="`circuit-component__ports--${name}`"
        class="circuit-component__ports"
      >
        <slot :name="index" />
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
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
    signal: (data: { id: string, value: number }) => true
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
      type: String as PropType<ItemSubtype>,
      required: true
    },
    name: {
      type: String,
      default: ''
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
        emit('signal', args)
      },
      ItemType,
      ItemSubtype
    }
  }
})
</script>

<style lang="scss">
.circuit-component {
  outline: none;
  filter: drop-shadow(0 0 6px transparent);

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
      align-items: flex-end;
      padding-top: var(--integrated-circuit-wire-height);
    }

    &--right {
      align-items: flex-end;
      flex-direction: column;
    }

    &--top {
      bottom: 50%;
      align-items: flex-start;
      padding-bottom: var(--integrated-circuit-wire-height);
    }
  }

  &--selected {
    filter: drop-shadow(0 0 6px var(--color-secondary));
  }

  &--flash {
    animation: flash 1s normal ease-out;
  }

  &--custom {
    .circuit-component__ports {
      &--left, &--right {
        padding: var(--integrated-circuit-wire-height) 0;
      }

      &--top {
        margin-top: calc(var(--integrated-circuit-wire-height) * -1);
      }

      &--top, &--bottom {
        margin-left: calc(var(--integrated-circuit-wire-height) + 6px);
        margin-right: calc(var(--integrated-circuit-wire-height) + 6px);
      }
    }
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
