<template>
  <mobile-popout-menu-item
    :label="`${label}${dirty ? '*' : ''}`"
    :icon="faMicrochip"
    :active="active"
    @click="$emit('activate')"
    @close="$emit('close')"
  />
</template>

<script lang="ts">
import { faMicrochip } from '@fortawesome/free-solid-svg-icons'
import { defineComponent } from 'vue'
import MobilePopoutMenuItem from './MobilePopoutMenuItem.vue'

export default defineComponent({
  components: { MobilePopoutMenuItem },
  name: 'MobileDocumentTabItem',
  emits: {
    activate: () => true,
    close: () => true
  },
  props: {
    label: {
      type: String,
      required: true
    },
    dirty: {
      type: Boolean,
      default: false
    },
    active: {
      type: Boolean,
      default: false
    }
  },
  setup () {
    return { faMicrochip }
  }
})
</script>
