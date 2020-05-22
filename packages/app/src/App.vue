<template>
  <List  />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import List from './modules/todo/components/list.vue';

@Component({
  components: {
    List,
  },
})
export default class App extends Vue {
}
</script>
