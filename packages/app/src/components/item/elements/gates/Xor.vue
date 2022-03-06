<template>
  <or :is-xor="true" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Or from './Or.vue'

export default defineComponent({
  name: 'Xor',
  components: { Or }
})
</script>
