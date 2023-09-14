<template>
  <component
    v-bind:is="subtype"
    v-bind="$props"
  />
</template>

<script lang="ts">
import ItemSubtype from '@/types/enums/ItemSubtype'
import CustomCircuit from './integratedCircuits/CustomCircuit/CustomCircuit.vue'
import DigitDisplay from './integratedCircuits/DigitDisplay.vue'
import { defineComponent, PropType, watch } from 'vue'
import Direction from '@/types/enums/Direction'
import Port from '@/types/interfaces/Port'

const components = {
  CustomCircuit,
  DigitDisplay
}

export default defineComponent({
  name: 'IntegratedCircuit',
  components,
  props: {
    ports: {
      type: Object as PropType<Record<Direction, Port[]>>,
      default: () => {}
    },
    subtype: {
      type: String as PropType<ItemSubtype>,
      required: true
    },
    name: {
      type: String,
      default: ''
    }
  }
})
</script>
