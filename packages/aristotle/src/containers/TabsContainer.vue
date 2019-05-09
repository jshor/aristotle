<template>
  <tab-host>
    <tab
      v-for="document in documents"
      :key="document.id"
      :id="document.id"
      :name="`${document.id}.alfx`"
      :active="document.id === activeDocumentId"
      @activate="activateDocument(document.id)"
      @close="closeDocument(document.id)"
    />
  </tab-host>
</template>

<script>
import { mapState } from 'vuex'
import TabHost from '@/components/TabHost'
import Tab from '@/components/Tab'

export default {
  name: 'TabsContainer',
  components: {
    TabHost,
    Tab
  },
  computed: mapState([
    'documents',
    'activeDocumentId'
  ]),
  methods: {
    activateDocument (documentId) {
      this.$store.commit('ACTIVATE_DOCUMENT', documentId)
    },
    closeDocument (documentId) {
      console.log('will close', documentId)
    }
  }
}
</script>
