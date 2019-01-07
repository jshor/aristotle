<template>
  <div id="app">
    <button @click="openDocument">Open Document</button>

    <DocumentContainer v-for="document in documents" :key="document.id" />
  </div>
</template>

<script>
import { mapState } from 'vuex'
import DocumentContainer from '@/containers/DocumentContainer'
import DocumentModel from '@/models/DocumentModel'
import data from '@/services/data.json'

export default {
  name: 'App',
  components: {
    DocumentContainer
  },
  computed: {
    ...mapState({
      documents: (state) => state.documents.documents
    })
  },
  mounted () {
    // console.log('stugf: ', CircuitNode)
  },
  methods: {
    openDocument () {
      const document = new DocumentModel()

      document.data = JSON.stringify(data)

      this.$store.commit('OPEN_DOCUMENT', document)
    }
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
