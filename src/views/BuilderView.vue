<template>
  <modal
    v-model="isBuilderOpen"
    @update:modelValue="close"
    title="Build Circuit"
  >
    <!-- <p>Drag the ports to re-arrange their order, or click on labels to edit them.</p> -->
    <div class="builder-canvas">
      <builder v-model="item" />
    </div>
    <template v-slot:buttons>
      <modal-button
        text="Cancel"
        @click="close"
        inverted
      />
      <modal-button
        text="Save"
        @click="save"
      />
    </template>
  </modal>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import Builder from '@/components/builder/Builder.vue'
import { useIntegratedCircuitStore } from '@/store/integratedCircuit'
import Modal from '@/components/modal/Modal.vue'
import ModalButton from '@/components/modal/ModalButton.vue'

export default defineComponent({
  name: 'BuilderView',
  components: {
    Builder,
    Modal,
    ModalButton
  },
  setup () {
    const { isBuilderOpen, model, save, close } = useIntegratedCircuitStore()
    const isOpen = ref(false)

    isOpen.value = true

    return {
      item: model as Item,
      isBuilderOpen,
      save,
      close,
      isOpen,
    }
  }
})
</script>

<style lang="scss">
.builder-canvas {
  // background: #999;
  padding: 0 40px;
  text-align: center;
  // flex: 1;
}
</style>
