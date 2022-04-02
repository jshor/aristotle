<template>
  <Document />
</template>

<script lang="ts">
/// <reference path="./types/index.d.ts" />
import { defineComponent } from 'vue'
import Document from './containers/Document.vue'

export default defineComponent({
  name: 'App',
  components: {
    Document
  }
})
</script>

<style lang="scss">
body {
  padding: 0;
  margin: 0;
  user-select: none;
  font-family: system-ui;
  min-height: 100vh;
  min-height: -webkit-fill-available;
  overflow: hidden;
}
</style>
