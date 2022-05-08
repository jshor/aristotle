<template>
  <div class="status-bar">
    <div class="status-bar__status">
      <span v-if="isPrinting">Printing...</span>
      <span v-else-if="isCreatingImage">Rendering image...</span>
      <span v-else>Ready</span>
    </div>
    <div class="status-bar__ui">
      <input type="range" id="volume" name="volume" step="0.25"
         min="0.25" max="2" v-model.number="store.zoomLevel">
         {{ store.zoomLevel }}
    </div>
  </div>
</template>

<script lang="ts">
import DocumentState from '@/store/DocumentState'
import { StoreDefinition } from 'pinia'
import { defineComponent, PropType, computed } from 'vue'

export default defineComponent({
  name: 'StatusBar',
  props: {
    store: {
      type: Function as PropType<StoreDefinition<string, DocumentState>>,
      required: true
    }
  },
  setup (props) {
    const store = props.store()
    const isPrinting = computed(() => store.isPrinting)
    const isCreatingImage = computed(() => store.isCreatingImage)

    return {
      store,
      isPrinting,
      isCreatingImage
    }
  }
})
</script>

<style lang="scss">
.status-bar {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-secondary);
  height: 100%;
  box-sizing: border-box;
  box-shadow: 0 0 $border-width var(--color-shadow);
  font-size: 0.85em;
  padding: 0 0.5em;
  color: $color-secondary;

  &__status, &__ui {
    flex: 1;
  }

  &__ui {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
