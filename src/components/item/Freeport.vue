<template>
  <port-handle />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PortHandle from '../port/PortHandle.vue'

export default defineComponent({
  name: 'Freeport',
  components: { PortHandle }
})
</script>
