<template>
  <oscilloscope-viewer
    v-if="isOscilloscopeOpen"
    v-model="oscilloscopeHeight"
  >
    <oscilloscope-title-bar
      :clearable="hasWaves"
      @clear="clearOscilloscope"
      @close="closeOscilloscope"
      @remove-all="destroyOscilloscope"
      @contextmenu="onContextMenu"
    />
    <div v-if="!hasWaves">
      no waves to observe
    </div>
    <oscilloscope-timeline
      v-else
      v-model="oscilloscopeWidth"
      :oscillogram="oscillogram"
      :ports="ports"
      @contextmenu="onContextMenu"
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
import oscilloscopeContextMenu from '@/menus/context/oscilloscope'

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
      oscilloscopeWidth,
      isOscilloscopeOpen,
      oscillogram,
      ports
    } = storeToRefs(store)
    const { closeOscilloscope, destroyOscilloscope } = store
    const hasWaves = computed(() => Object.keys(store.oscillogram).length > 0)

    function clearOscilloscope () {
      store.oscillator.clear()
    }

    function onContextMenu ($event: MouseEvent, portId?: string) {
      window
        .api
        .showContextMenu(oscilloscopeContextMenu(props.store, portId))

      $event.stopPropagation()
      $event.preventDefault()
    }

    return {
      hasWaves,
      oscillogram,
      ports,
      oscilloscopeHeight,
      oscilloscopeWidth,
      isOscilloscopeOpen,
      clearOscilloscope,
      closeOscilloscope,
      destroyOscilloscope,
      onContextMenu
    }
  }
})
</script>
