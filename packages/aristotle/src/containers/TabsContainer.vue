<template>
  <div class="tab-container">
    <div class="tabs">
      <tab
        v-for="document in documents"
        :key="document.id"
        :id="document.id"
        :name="`${document.id}.alfx`"
        :active="document.id === activeDocumentId"
        @activate="activateDocument(document.id)"
        @close="closeDocument(document.id)"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Tab from '@/components/Tab'

export default {
  name: 'TabsContainer',
  components: { Tab },
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

<style lang="scss">
$color-bg-primary: #1D1E25;
$color-bg-secondary: #333641;
$color-bg-tertiary: #3D404B;
$color-bg-quaternary: #454857;

$color-primary: #fff;
$color-secondary: #9ca0b1;

$color-shadow: #000;

$border-width: 1px;
$scrollbar-width: 3px;


.tab-container {
  position: relative;
  background-color: $color-bg-secondary;
  max-height: 100%;
  
  &::after {
    height: $scrollbar-width;
    content: '';
    display: block;
    background-color: $color-bg-secondary;
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    opacity: 1;
    transition: all 0.5s;
    pointer-events: none;
    border-style: solid;
    border-color: $color-bg-tertiary;
    border-width: 0 $border-width 0 $border-width;
  }
    
  &:hover {
    &::after {
      opacity: 0;
    }
  }
}

.tabs {
  display: flex;
  align-items: flex-end;
  padding-bottom: $scrollbar-width;
  box-sizing: border-box;
  overflow-x: overlay;
  text-shadow: $border-width 0 0 $color-shadow;
  height: 100%;
  
  &::after {
    flex: 1;
    border-top: $border-width solid $color-bg-primary;
    border-bottom: $border-width solid $color-bg-quaternary;
    background-color: $color-bg-primary;
    padding: 0.5rem 0;
    content: '\00a0';
  }
  
  &::-webkit-scrollbar
  {
    background-color: $color-bg-secondary;
    height: $scrollbar-width;
    z-index: -1;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: $color-secondary;
    transition: all 1s;
  }
}
</style>