<template>
  <div class="selector" @mousedown.left.self="mousedown">
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

  @Getter('documents', 'zoom')
  public zoom: number

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

  getPosition (event) {
    const { top, left } = (this.$el as any).getBoundingClientRect()
    const x = (event.x - left) / this.zoom
    const y = (event.y - top) / this.zoom

    return { x, y }
  }

  mousedown (event) {
    const position = this.getPosition(event)

    this.selection = true
    this.start = position
    this.end = position

    this.$emit('selectionStart')
  }

  mousemove (event) {
    if (this.selection) {
      this.end = this.getPosition(event)
    }
  }

  mouseup (event) {
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
