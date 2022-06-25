<template>
  <component
    v-bind:is="component"
    v-bind="$props"
  />
</template>

<script lang="ts">
import ItemSubtype from '@/types/enums/ItemSubtype'
import CustomCircuit from './integratedCircuits/CustomCircuit.vue'
import DigitDisplay from './integratedCircuits/DigitDisplay.vue'
import { defineComponent, PropType } from 'vue'

export default defineComponent({
  name: 'IntegratedCircuit',
  components: {
    CustomCircuit,
    DigitDisplay
  },
  props: {
    ports: {
      type: Array as PropType<Port[]>,
      default: () => []
    },
    subtype: {
      type: String,
      default: 'CustomCircuit'
    }
  },
  setup (props) {
    const component = (() => {
      switch (props.subtype) {
        case ItemSubtype.DigitDisplay:
          return props.subtype
        default:
          return 'CustomCircuit'
      }
    })()

    return { component }
  }
})
</script>
