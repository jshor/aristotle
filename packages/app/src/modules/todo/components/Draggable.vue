<template>
  <div ref="draggable" class="draggable" :style="style">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import $ from 'jquery'

@Component({})
export default class Draggable extends Vue {
  @Prop({
    default: () => ({
      x: 0,
      y: 0
    })
  })
  public position: any

  @Prop({ default: '.snappable' })
  public snap: string

  @Prop({ default: false })
  public revert: boolean

  get style () {
    return {
      left: `${this.position.x}px`,
      top: `${this.position.y}px`
    }
  }

  mounted () {
    const el = ($(this.$refs.draggable) as any)
    const snapSize = 1
    const round = n => snapSize * Math.ceil(n / snapSize)

    el.draggable({
      // snap: true,
      snap: this.snap,
      cancel: '.non-draggable',
      grid: [ snapSize, snapSize ],
      drag: () => {
        const offset = el[0].getBoundingClientRect()
        const x = round(offset.left)
        const y = round(offset.top)

        this.$emit('drag', {
          position: { x, y }
        })
      },
      start: () => {
        const offset = el[0].getBoundingClientRect()
        const x = round(offset.left)
        const y = round(offset.top)

        this.$emit('dragStart', {
          position: { x, y }
        })
      },
      stop: (event, ui) => {
        const snappedId = $(el)
          .data('uiDraggable')
          .snapElements
          .filter(({ snapping }) => snapping)
          .map((e) => e.item.dataset.id)
          .filter(id => id)
          .pop()

        console.log('snapped to:', snappedId)
        const offset = el[0].getBoundingClientRect()
        const x = round(offset.left)
        const y = round(offset.top)

        this.$emit('dragEnd', {
          position: { x, y },
          snappedId
        })
      }
    })
  }
}
</script>

<style lang="scss">
.draggable {
  width: 1px;
  height: 1px;
  position: relative;
}
</style>
