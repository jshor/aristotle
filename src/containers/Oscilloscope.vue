<template>
  <div style="height: 100%">
    <oscilloscope-title-bar
      :clearable="!isDebugging && isOscilloscopeEnabled && hasWaves"
      @clear="clearOscilloscope"
    />
    <oscilloscope-viewer v-if="isDebugging">
      oscilloscope not available in debugging mode
    </oscilloscope-viewer>
    <oscilloscope-viewer v-else-if="!isOscilloscopeEnabled">
      the oscilloscope isn't enabled
    </oscilloscope-viewer>
    <oscilloscope-viewer v-else-if="!hasWaves">
      no waves to observe
    </oscilloscope-viewer>
    <oscilloscope-timeline
      v-else
      :oscillogram="oscillogram"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { StoreDefinition, storeToRefs } from 'pinia'
import OscilloscopeTimeline from '@/components/oscilloscope/OscilloscopeTimeline.vue'
import OscilloscopeTitleBar from '@/components/oscilloscope/OscilloscopeTitleBar.vue'
import OscilloscopeViewer from '@/components/oscilloscope/OscilloscopeViewer.vue'
import DocumentState from '@/store/DocumentState'

export default defineComponent({
  name: 'Oscilloscope',
  components: {
    OscilloscopeTimeline,
    OscilloscopeTitleBar,
    OscilloscopeViewer
  },
  props: {
    store: {
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  setup (props) {
    const store = props.store()
    const {
      oscillogram,
      isDebugging,
      isOscilloscopeEnabled
    } = storeToRefs(store)
    const hasWaves = computed(() => Object.keys(oscillogram).length > 0)

    return {
      isDebugging,
      isOscilloscopeEnabled,
      hasWaves,
      oscillogram,
      clearOscilloscope: store.clearOscilloscope
    }
  }
})
</script>
