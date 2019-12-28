<template>
  <div class="splash">
    <div class="splash__logo" />
    <div class="splash__content">
      <div class="splash__title">Aristotle</div>
      <div class="splash__slogan">The digital logic simulator.</div>
      <div class="splash__button" @click="$emit('new')"><i class="splash__icon fas fa-file" /> Create a new project</div>
      <div class="splash__button" @click="$emit('open')"><i class="splash__icon fas fa-folder-open" /> Load a sample project</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Splash'
}
</script>

<style lang="scss">
.splash {
  display: flex;
  max-width: 500px;
  align-items: center;
  justify-content: center;

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__logo {
    background-image: url('../assets/logo.svg');
    background-size: cover;
    background-repeat: no-repeat;
    width: 175px;
    height: 230px;
    margin-right: 2rem;
  }

  &__title {
    font-size: 3rem;
    padding: 0 0.5rem;
    margin-right: 4rem;
    color: $color-primary;
  }

  &__slogan {
    color: $color-secondary;
    font-size: 1rem;
    padding: 0.5rem;
  }

  &__icon {
    margin: 0.25rem;
  }

  &__button {
    border-radius: 2px;
    background-color: $color-bg-secondary;
    border: 1px solid $color-bg-secondary;
    color: $color-primary;
    padding: 0.5rem;
    margin: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: $color-bg-primary;
    }
  }
}
</style>
