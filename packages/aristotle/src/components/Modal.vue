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
  z-index: 1002;
  // display: flex;
  // align-items: center;
  // justify-content: center;

  &__inner {
    width: 100%;
    // max-width: 700px;
    background-color: $color-bg-primary;
    border-radius: 2px;
    padding: 1rem;
    border-radius: 2px;
    animation: 1s reveal forwards;
  }

  &__title {
    font-size: 2em;
    color: $color-primary;
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
