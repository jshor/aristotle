<template>
  <div id="app">
    <button @click="openDocument">Open Document</button>

    <DocumentContainer v-for="document in documents" :key="document.id" />
  </div>
</template>

<script lang="ts">
import { mapState } from 'vuex'
import { Component, Vue } from 'vue-property-decorator'
import DocumentContainer from './containers/DocumentContainer'
import DocumentModel from './models/DocumentModel'
import { State } from './store'
import data from './services/data.json'

@Component({
  components: {
    DocumentContainer
  },
  computed: {
    ...mapState({
      documents: (state: State) => state.documents.documents
    })
  }
})
export default class App extends Vue {
  openDocument () {
    const document = new DocumentModel()

    document.data = JSON.stringify(data)

    this.$store.commit('OPEN_DOCUMENT', document)
  }
}
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
