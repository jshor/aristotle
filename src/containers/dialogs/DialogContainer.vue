<template>
  <modal
    v-if="!isClosing"
    v-model="isOpen"
    :title="title"
  >
    <slot />
  </modal>
</template>

<script lang="ts" setup>
import { computed, watch, ref } from 'vue'
import Modal from '@/components/modal/Modal.vue'
import { ViewType } from '@/types/enums/ViewType'
import { useRootStore } from '@/store/root'

const rootStore = useRootStore()
const props = defineProps<{
  dialogType: ViewType
  title: string
  onBeforeClose?: () => Promise<boolean>
}>()
const isClosing = ref(false)
const isOpen = computed({
  get () {
    return rootStore.dialogType === props.dialogType
  },
  set (value) {
    if (!value) {
      closeDialog(false)
    }
  }
})

/**
 * Close the dialog.
 */
async function closeDialog (immediate = true) {
  let result = true

  if (props.onBeforeClose) {
    result = await props.onBeforeClose()
  }

  isClosing.value = immediate
  rootStore.dialogType = ViewType.None

  await new Promise(resolve => setTimeout(resolve))

  isClosing.value = false

  return result
}

watch(isOpen, value => {
  rootStore.closeDialog = value
    ? closeDialog
    : undefined
})
</script>
