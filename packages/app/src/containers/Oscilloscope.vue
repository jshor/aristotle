<template>
  <oscilloscope-viewer :oscilloscope="oscilloscope" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { StoreDefinition, storeToRefs } from 'pinia'
import OscilloscopeViewer from '@/components/oscilloscope/OscilloscopeViewer.vue'
import DocumentState from '@/store/DocumentState'

export default defineComponent({
  name: 'Oscilloscope',
  components: {
    OscilloscopeViewer
  },
  props: {
    store: {
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  setup (props) {
    const { oscilloscope } = props.store()

    return { oscilloscope }
  }
})
</script>
