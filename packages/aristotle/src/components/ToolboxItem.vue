<template>
  <div class="toolbox-item">
    <div
      class="toolbox-item__draggable draw2d_droppable ui-draggable"
      :data-type="type"
      :data-subtype="subtype">
      <img
        :src="src"
        :style="{
          width: `${width * (1 / zoomFactor)}px`
        }"
      />
    </div>
    <div class="toolbox-item__visible">
      <img :src="src" class="toolbox-item__thumbnail" />
      <div class="toolbox-item__caption">{{ caption }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ToolboxItem',
  props: {
    width: {
      type: Number,
      required: true
    },
    src: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    subtype: {
      type: String,
      default: ''
    },
    zoomFactor: {
      type: Number,
      default: 1
    },
    caption: {
      type: String,
      default: 'TODO' // TODO
    }
  }
}
</script>

<style lang="scss">
.toolbox-item {
  width: 50%;
  position: relative;
  cursor: move;

  & > &__draggable {
    overflow: hidden;
    opacity: 0;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  &__visible {
    background-position: center center;
    pointer-events: none;
  }

  &__thumbnail {
    padding: 1rem;
    box-sizing: border-box;
    width: 100%;
  }

  &__caption {
    padding: 0 1rem 1rem;
    text-align: center;
    color: $color-primary;
    text-transform: uppercase;
  }
}
</style>
