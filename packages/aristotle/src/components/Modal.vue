<template>
  <div class="modal">
    <div class="modal__inner">
      <div class="modal__title">{{ title }}</div>
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    title: {
      type: String,
      default: ''
    }
  }
}
</script>

<style lang="scss">
.modal {
  background-color: rgba(0, 0, 0, 0.5);
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 800;
  display:flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;

  &__horizontal-padding {
    flex: 1;
  }

  &__inner {
    box-shadow: 0 0 10vw rgba(255,255,255,0.15);
    border: 1px solid $color-bg-secondary;
    width: 100%;
    max-width: 700px;
    background-color: $color-bg-primary;
    border-radius: 2px;
    padding: 1rem;
    border-radius: 2px;
    animation: 0.5s reveal forwards;
  }

  &__title {
    font-size: 2em;
    color: $color-secondary;
  }
}

@keyframes reveal {
  from {
    opacity: 0;
    filter: blur(3px);
  }
  to {
    opacity: 1;
    filter: blur(0);
  }
}
</style>
