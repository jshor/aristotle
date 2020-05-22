<template>
  <div class="selector" @mousedown.self="mousedown">
    <div v-if="selection" ref="selection" class="selector__selection" :style="style" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator';
import Draggable from './Draggable.vue'
import Port from './Port.vue'
import Wire from './Wire.vue'
import Group from './Group.vue'
import Item from './Item.vue'
import { mapActions } from 'vuex'
import { Getter, Action } from '../store/decorators'

@Component({
  components: {
    Draggable,
    Port,
    Wire,
    Group,
    Item
  },
  methods: mapActions([
    'groupItems',
    'ungroupItems',
    'destroyGroup',
    'updateGroupItemPositions',
    'updateItemPosition',
    'updatePortPositions',
    'updateProperties',
    'rotate'
  ])
})
export default class List extends Vue {
  selection: boolean = false

  start: any = {
    x: 0,
    y: 0
  }

  end: any = {
    x: 0,
    y: 0
  }

  get style () {
    return {
      left: `${Math.min(this.start.x, this.end.x)}px`,
      top: `${Math.min(this.start.y, this.end.y)}px`,
      width: `${Math.abs(this.start.x - this.end.x)}px`,
      height: `${Math.abs(this.start.y - this.end.y)}px`
    }
  }

  mounted () {
    window.addEventListener('mousemove', this.mousemove)
    window.addEventListener('mouseup', this.mouseup)
  }

  destroy () {
    window.removeEventListener('mousemove', this.mousemove)
    window.removeEventListener('mouseup', this.mouseup)
  }

  mousedown ({ x, y }) {
    this.selection = true
    this.start.x = x
    this.start.y = y
    this.end.x = x
    this.end.y = y

    this.$emit('selectionStart')
  }

  mousemove ({ x, y }) {
    if (this.selection) {
      this.end.x = x
      this.end.y = y
    }
  }

  mouseup ({ x, y }) {
    if (this.selection) {
      this.createSelection()

      this.selection = false
      this.start.x = 0
      this.start.y = 0
      this.end.x = 0
      this.end.y = 0
    }
  }

  createSelection () {
    this.$emit('selectionEnd', (this.$refs.selection as any).getBoundingClientRect())
  }
}
</script>

<style lang="scss">
.selector {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.selector__selection {
  position: relative;
  border: 1px dashed #808080;
  background-color: rgba(0, 0, 0, 0.1);
}
</style>
