<template>
  <div ref="draggable" class="draggable" :style="style">
    <div class="draggable__inner" :style="{
    }">
      <slot />
    </div>
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

  getCanvas (parent) {
    if (parent.$refs.canvas) {
      return parent
    }
    return this.getCanvas(parent.$parent)
  }


  mounted () {
    const el = ($(this.$refs.draggable) as any)
    const snapSize = 1
    const round = n => n //  snapSize * Math.ceil(n / snapSize)
    var click = {
      x: 0,
      y: 0
    };
    const canvas = this.getCanvas(this)

    el.draggable({
      snap: ['.snappable', this.snap].join(', '),
      snapMode: 'inner',
      cancel: '.non-draggable',
      grid: [ snapSize, snapSize ],
      drag: (event, ui) => {
        const snappedId = $(el)
          .data('uiDraggable')
          .snapElements
          .filter(({ snapping }) => snapping)
          .pop()

        const original = ui.originalPosition

        ui.position = {
          left: (event.clientX - click.x + original.left) / this.zoom,
          top:  (event.clientY - click.y + original.top ) / this.zoom
        }


        if (snappedId) {
          const parentRect = this.$parent.$el.getBoundingClientRect()
          const parent = canvas.fromDocumentToEditorCoordinates(parentRect)
          const coords = canvas.fromDocumentToEditorCoordinates(snappedId.item.getBoundingClientRect())
          const left = coords.x - parent.x
          const top = coords.y - parent.y

          /* when the dragging element is positioned relative to the canvas */
          if (Math.abs(coords.x - ui.position.left) < 30) {
            ui.position.left = coords.x
          }

          if (Math.abs(coords.y - ui.position.top) < 30) {
            ui.position.top = coords.y
          }

          /* when the dragging element is positioned relative to its parent */
          if (Math.abs(left - ui.position.left) < 30) {
            ui.position.left = left
          }

          if (Math.abs(top - ui.position.top) < 30) {
            ui.position.top = top
          }
        }

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

        // ui.position = {
        //     left: (event.clientX - click.x + original.left) / this.zoom,
        //     top:  (event.clientY - click.y + original.top ) / this.zoom
        // };

        this.$emit('dragEnd', {
          position: {
            x: (event.clientX - click.x + original.left) / this.zoom,
            y: (event.clientY - click.y + original.top ) / this.zoom
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

  &__inner {
    position: absolute;
  }
}
</style>
