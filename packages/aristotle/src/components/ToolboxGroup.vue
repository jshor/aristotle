<template>
  <div class="toolbox-group">
    <div
      class="toolbox-group__heading"
      @click="active = !active">
      <span>{{ heading }}</span>
      <i
        class="toolbox-group__caret fas"
        :class="{
          'fa-angle-down': active,
          'fa-angle-double-down': !active,
        }"
      />
    </div>
    <div
      class="toolbox-group__elements"
      :class="{
        'toolbox-group__elements--active': active
      }">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ToolboxGroup',
  props: {
    heading: {
      type: String,
      required: true
    }
  },
  data () {
    return { active: true }
  }
}
</script>

<style lang="scss">
.toolbox-group {
  &__heading {
    padding: 0.5rem;
    padding-bottom: calc(0.5rem + 2px);
    color: $color-primary;
    background-color: $color-bg-secondary;
    text-shadow: 1px 0 0 #000;
    line-height: 1rem;
    display: flex;
    justify-content: space-between;
    cursor: pointer;
  }

  &:not(:first-of-type) &__heading {
    border-top: 1px solid $color-bg-tertiary;
    padding-top: calc(0.5rem + 2px);
  }

  &__elements {
    height: 0;
    overflow: hidden;
    width: 100%;

    &--active {
      height: auto;
    }
  }
}
</style>
