<template>
  <buffer :is-negated="true" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Buffer from './Buffer.vue'

export default defineComponent({
  name: 'Not',
  components: { Buffer }
})
</script>
