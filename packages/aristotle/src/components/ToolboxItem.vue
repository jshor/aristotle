<template>
  <div class="toolbox-item">
    <div
      class="toolbox-item__draggable draw2d_droppable ui-draggable"
      :data-type="type"
      :data-params="encodedParams">
      <img
        :src="src"
        :style="{
          width: `${width * zoomLevel}px`
        }"
      />
    </div>
    <div class="toolbox-item__visible">
      <div
        class="toolbox-item__thumbnail"
        :style="{ backgroundImage: `url(${src})` }"
      />
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
      default: ' '
      // required: true
    },
    type: {
      type: String,
      required: true
    },
    params: {
      type: Object,
      required: true
    },
    zoomLevel: {
      type: Number,
      default: 1
    },
    caption: {
      type: String,
      default: 'TODO' // TODO
    }
  },
  computed: {
    encodedParams () {
      return btoa(JSON.stringify(this.params))
    }
  }
}
</script>

<style lang="scss">
.toolbox-item {
  width: 50%;
  overflow: hidden;
  position: relative;
  cursor: move;
  box-sizing: border-box;
  padding: 1rem;
  display: inline-block;

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
    box-sizing: border-box;
    width: 100%;
    padding-bottom: 75%;
    background-position: center center;
    background-size: contain;
    background-repeat: no-repeat;
  }

  &__caption {
    padding-top: 0.5rem;
    text-align: center;
    color: $color-primary;
    box-sizing: border-box;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
