<template>
  <and :is-negated="true" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import And from './And.vue'

export default defineComponent({
  name: 'Nand',
  components: { And }
})
</script>
