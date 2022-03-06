<template>
  <or :is-negated="true" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Nor from './Nor.vue'

export default defineComponent({
  name: 'Xor',
  components: { Nor }
})
</script>
