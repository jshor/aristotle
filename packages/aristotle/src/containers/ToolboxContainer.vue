<template>
  <div class="toolbox">
    <div class="toolbox__border">
      <div class="toolbox__pane">
        <img :src="buffer" class="draw2d_droppable ui-draggable" ref="svg" />
        Nor
      </div>
    </div>
  </div>
</template>

<script>
import { renderGate } from '@aristotle/logic-gates'

export default {
  name: 'Toolbox',
  data () {
    return {
      buffer: renderGate('NOR', 2, '#000').path
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
}
</style>