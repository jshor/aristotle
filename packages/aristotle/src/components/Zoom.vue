<template>
  <div class="zoom">
    <button
      class="zoom__out"
      :disabled="false"
      @click="setZoom(-1)">
      <i class="fas fa-search-minus" />
    </button>
    <div class="zoom__level">{{ level }}%</div>
    <button
      class="zoom__out"
      @click="setZoom(1)">
      <i class="fas fa-search-plus" />
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component({
  props: {
    level: {
      type: Number,
      default: 100
    }
  },
  methods: {
    setZoom (direction: number): void {
      const zoomLevels = [
        20, 25, 50, 75, 100, 150, 200, 350, 500, 750, 1000
      ]

      const currentIndex = zoomLevels
        .findIndex((value, index) => {
          return this.$props.level < value
        })
      const nextIndex = currentIndex + direction - 1

      if (zoomLevels[nextIndex]) {
        const nextLevel = 1 / (zoomLevels[nextIndex] / 100)

        this.$emit('change', nextLevel)
      }
    }
  }
})
export default class Zoom extends Vue {
}
</script>

<style lang="scss">
.zoom {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background-color: $color-bg-primary;
  border-radius: 2px;
  color: $color-primary;
  display: flex;
  box-sizing: border-box;
  border: 1px solid $color-bg-tertiary;

  &__in, &__out, &__level {
    padding: 0.25rem;
  }

  &__level {
    border-style: solid;
    border-color: $color-bg-tertiary;
    border-width: 0 1px;
    width: 2rem;
    text-align: center;
    font-size: 0.85em;
  }

  &__in, &__out {
    border: 0;
    outline: none;
    background-color: transparent;

    &:not(:disabled) {
      cursor: pointer;
    }

    &:hover:not(:disabled) {
      background-color: $color-bg-secondary;
    }

    &:active:not(:disabled) {
      background-color: $color-bg-tertiary;
    }

    &:disabled {
      color: $color-bg-secondary;
    }
  }
}

</style>
