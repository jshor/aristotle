<template>
  <toolbox-layout :is-open="isOpen">
    <template
      v-for="(factorySubtypes, type) in factories"
      v-slot:[type]
    >
      <toolbox-item
        v-for="(factory, label) in factorySubtypes"
        :factory="factory"
        :key="label"
        :label="label"
        :zoom="zoom"
        @drop="onDrop"
      />
    </template>
  </toolbox-layout>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { DocumentStore } from '@/store/document'
import { useIntegratedCircuitStore } from '@/store/integratedCircuit'
import ScrollFade from '@/components/layout/ScrollFade.vue'
import ToolboxItem from '@/components/toolbox/ToolboxItem.vue'
import ToolboxLayout from '@/components/toolbox/ToolboxLayout.vue'
import factories from '@/factories'
import ItemType from '@/types/enums/ItemType'
import ItemFactory from '@/types/types/ItemFactory'
import Point from '@/types/interfaces/Point'

export default defineComponent({
  name: 'Toolbox',
  components: {
    ScrollFade,
    ToolboxItem,
    ToolboxLayout
},
  props: {
    store: {
      type: Function as PropType<DocumentStore>,
      required: true
    },
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  setup (props) {
    const integratedCircuitStore = useIntegratedCircuitStore()
    const zoom = computed(() => props.store().zoom)
    const circuits = computed(() => integratedCircuitStore.factories)

    integratedCircuitStore.loadAllToolbox()

    function onDrop (factory: ItemFactory, position?: Point) {
      const store = props.store()

      store.deselectAll()
      store.insertItemAtPosition(factory(), position)
    }

    return {
      factories: {
        ...factories,
        [ItemType.IntegratedCircuit]: circuits.value
      },
      zoom,
      onDrop
    }
  }
})
</script>
