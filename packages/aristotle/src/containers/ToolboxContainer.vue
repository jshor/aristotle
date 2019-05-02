<template>
  <div class="toolbox">
    <div class="toolbox__border">
      <div
        class="toolbox__pane">
        <div class="toolbox__item">
          <div
            class="toolbox__draggable draw2d_droppable ui-draggable"
            :data-type="`LogicGate`"
            :data-subtype="`NOR`">
            <img
              :src="buffer"
              :style="{
                width: `${100 * (1 / activeDocument.zoomFactor)}px`
              }"
            />
          </div>
          <div class="toolbox__visible">
            <img :src="buffer" class="toolbox__thumbnail" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { renderGate } from '@aristotle/logic-gates'

export default {
  name: 'Toolbox',
  data () {
    return {
      buffer: renderGate('NOR', 2, '#000').path
    }
  },
  computed: {
    ...mapGetters(['activeDocument'])
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

.toolbox {
  padding: 0.5rem 0 0.5rem 0.5rem;
  height: 100%;
  box-sizing: border-box;

  &__border {
    box-shadow: 0 0 $border-width $color-shadow;
    box-sizing: border-box;
    height: 100%;
    border: $border-width solid $color-bg-tertiary;
    background-color: $color-bg-quaternary;
    padding: 3px;
  }

  &__pane {
    height: 100%;
    background-color: $color-primary;
  }

  &__item {
    width: 50%;
    position: relative;
    
    .toolbox__draggable {
      overflow: hidden;
      opacity: 0;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
    }
  }

  &__visible {
    pointer-events: none;
    background-color: red;
  }
}
</style>