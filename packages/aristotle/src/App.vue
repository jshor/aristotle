<template>
  <div id="app">
    <Editor />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Editor from '@/components/Editor/index.vue'

@Component({
  components: {
    Editor
  }
})
export default class App extends Vue {}
</script>

<style lang="scss">
rect.draw2d {
  &_ResizeHandle {
    display: none;
  }

  &_shape_basic_Rectangle:not(:last-of-type) {
    stroke: none;
  }
}
</style>
