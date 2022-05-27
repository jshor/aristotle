<template>
  <oscilloscope-viewer
    v-if="isOscilloscopeOpen"
    v-model="oscilloscopeHeight"
    :collapse-height="40"
    @collapse="closeOscilloscope"
  >
    <oscilloscope-title-bar
      :clearable="hasWaves"
      @clear="clearOscilloscope"
    />
    <div v-if="!hasWaves">
      no waves to observe
    </div>
    <oscilloscope-timeline
      v-else
      :oscillogram="oscillogram"
    />
  </oscilloscope-viewer>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue'
import { StoreDefinition, storeToRefs } from 'pinia'
import OscilloscopeTimeline from '@/components/oscilloscope/OscilloscopeTimeline.vue'
import OscilloscopeTitleBar from '@/components/oscilloscope/OscilloscopeTitleBar.vue'
import OscilloscopeViewer from '@/components/oscilloscope/OscilloscopeViewer.vue'
import { DocumentStore } from '@/store/document'

export default defineComponent({
  name: 'Oscilloscope',
  components: {
    OscilloscopeTimeline,
    OscilloscopeTitleBar,
    OscilloscopeViewer
  },
  props: {
    store: {
      type: Function as PropType<DocumentStore>,
      required: true
    }
  },
  setup (props) {
    const store = props.store()
    const {
      oscillogram,
      isDebugging,
      isOscilloscopeOpen,
      oscilloscopeHeight
    } = storeToRefs(store)
    const hasWaves = computed(() => Object.keys(oscillogram).length > 0)

    return {
      isDebugging,
      isOscilloscopeOpen,
      hasWaves,
      oscillogram,
      oscilloscopeHeight,
      clearOscilloscope: store.clearOscilloscope,
      closeOscilloscope: store.closeOscilloscope
    }
  }
})
</script>
