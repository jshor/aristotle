<template>
  <or
    :is-negated="true"
    :is-xor="true"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Or from './Or.vue'

export default defineComponent({
  name: 'Xnor',
  components: { Or }
})
</script>
