<template>
  <or :is-negated="true" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Or from './Or.vue'

export default defineComponent({
  name: 'Nor',
  components: { Or }
})
</script>
