<template>
  <div ref="draggable" class="draggable" :style="style">
    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import $ from 'jquery'
import { Getter } from '../store/decorators'

@Component({})
export default class Draggable extends Vue {
  @Prop({
    default: () => ({
      x: 0,
      y: 0
    })
  })
  public position: any

  // @Prop({ default: 1 })
  @Getter('documents', 'zoom')
  public zoom: number

  @Prop({ default: '.snappable' })
  public snap: string

  @Prop({ default: false })
  public revert: boolean

  @Prop({ default: false })
  public aug: boolean

  get style () {
    return {
      left: `${this.position.x}px`,
      top: `${this.position.y}px`
    }
  }

  mounted () {
    const el = ($(this.$refs.draggable) as any)
    const snapSize = 1
    const round = n => n //  snapSize * Math.ceil(n / snapSize)
    var click = {
      x: 0,
      y: 0
    };

    el.draggable({
      snap: this.snap,
      cancel: '.non-draggable',
      grid: [ snapSize, snapSize ],
      drag: (event, ui) => {
        const offset = el[0].getBoundingClientRect()
        const x = round(offset.left)
        const y = round(offset.top)

        var original = ui.originalPosition;

        ui.position = {
            left: (event.clientX - click.x + original.left) / this.zoom,
            top:  (event.clientY - click.y + original.top ) / this.zoom
        };

        this.$emit('drag', {
          position: {
            x: ui.position.left,
            y: ui.position.top
          }
        })
      },
      start: (event, ui) => {
        click.x = event.clientX;
        click.y = event.clientY;

        const offset = el[0].getBoundingClientRect()
        const x = round(offset.left)
        const y = round(offset.top)

        var original = ui.originalPosition;

        ui.position = {
            left: (event.clientX - click.x + original.left) / this.zoom,
            top:  (event.clientY - click.y + original.top ) / this.zoom
        };

        this.$emit('dragStart', {
          position: {
            x: ui.position.left,
            y: ui.position.top
          }
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
        // const snappedId = undefined

        const offset = el[0].getBoundingClientRect()
        const x = round(offset.left)
        const y = round(offset.top)

        var original = ui.originalPosition;

        ui.position = {
            left: (event.clientX - click.x + original.left) / this.zoom,
            top:  (event.clientY - click.y + original.top ) / this.zoom
        };

        this.$emit('dragEnd', {
          position: {
            x: ui.position.left,
            y: ui.position.top
          },
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
