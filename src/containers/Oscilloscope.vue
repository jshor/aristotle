<template>
  <oscilloscope-viewer
    v-if="isOscilloscopeOpen"
    v-model="oscilloscopeHeight"
    :collapse-height="40"
    @collapse="closeOscilloscope"
  >
    <oscilloscope-title-bar
      :clearable="hasWaves"
      :is-recording="isOscilloscopeRecording"
      @clear="clearOscilloscope"
      @toggle="toggleOscillatorRecording"
    />
    <div v-if="!hasWaves">
      no waves to observe
    </div>
    <oscilloscope-timeline
      v-else
      :oscillogram="oscillogram"
      :items="items"
      :ports="ports"
    />
  </oscilloscope-viewer>
</template>

<script lang="ts">
import { defineComponent, computed, PropType, ref } from 'vue'
import OscilloscopeTimeline from '@/components/oscilloscope/OscilloscopeTimeline.vue'
import OscilloscopeTitleBar from '@/components/oscilloscope/OscilloscopeTitleBar.vue'
import OscilloscopeViewer from '@/components/oscilloscope/OscilloscopeViewer.vue'
import { DocumentStore } from '@/store/document'
import { storeToRefs } from 'pinia'

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
      oscilloscopeHeight,
      isOscilloscopeOpen,
      isOscilloscopeRecording,
      oscillogram,
      items,
      ports
    } = storeToRefs(store)
    const {
      closeOscilloscope,
      toggleOscillatorRecording
    } = store
    const hasWaves = computed(() => Object.keys(store.oscillogram).length > 0)

    function clearOscilloscope () {
      store.oscillator.clear()
    }

    return {
      hasWaves,
      oscillogram,
      items,
      ports,
      oscilloscopeHeight,
      isOscilloscopeOpen,
      isOscilloscopeRecording,
      clearOscilloscope,
      closeOscilloscope,
      toggleOscillatorRecording
    }
  }
})
</script>
