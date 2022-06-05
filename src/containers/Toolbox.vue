<template>
  <toolbox-layout :is-open="isToolboxOpen">
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
import ScrollFade from '@/components/layout/ScrollFade.vue'
import ToolboxItem from '@/components/toolbox/ToolboxItem.vue'
import ToolboxLayout from '@/components/toolbox/ToolboxLayout.vue'
import factories from '@/factories'

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
    }
  },
  setup (props) {
    const store = props.store()
    const zoom = computed(() => store.zoom)
    const isToolboxOpen = computed(() => store.isToolboxOpen)

    function onDrop (factory: ItemFactory, position?: Point) {
      store.insertItemAtPosition(factory(), position)
    }

    return {
      factories,
      zoom,
      isToolboxOpen,
      onDrop
    }
  }
})
</script>
