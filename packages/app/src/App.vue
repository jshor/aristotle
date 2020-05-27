<template>
  <div class="app">
    <Documents />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Documents from './modules/documents/components/Documents.vue'

@Component({
  components: {
    Documents
  },
})
export default class App extends Vue {
}
</script>

<style lang="scss">
body {
  padding: 0;
  margin: 0;
  user-select: none;
  font-family: system-ui;
  min-height: 100vh;
  min-height: -webkit-fill-available;
}

.app {
  width: 100vw;
  height: 100vh;
  display: flex;
}
</style>
