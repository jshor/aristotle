<template>
  <div>
    <div class="landing" :class="{ 'landing--loaded': loaded }">
      <section class="landing__hero">
        <div class="landing__main">
          <div class="landing__logo">
            <img :src="$withBase('/assets/logo.svg')" />
          </div>
          <div class="landing__title">
            <h1>Build, simulate, and debug digital logic circuits.</h1>

            <h3>Aristotle is an open source digital logic simulator for Windows, Linux, and macOS.</h3>

            <downloads />
          </div>
        </div>

        <hook type="dark" />
        <hook type="light" />
      </section>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Downloads from './Downloads.vue'
import Hook from './Hook.vue'

export default defineComponent({
  name: 'Landing',
  components: {
    Downloads,
    Hook
  },
  data () {
    return {
      loaded: false
    }
  },
  mounted () {
    setTimeout(() => {
      this.loaded = true
    })
  }
})
</script>

<style lang="scss">
$accentColor: #3eaf7c;
$textColor: #2c3e50;
$borderColor: #eaecef;
$codeBgColor: #1B1B23;
$shadowColor: #000000;

.landing {
  opacity: 0;
  transition: opacity 0.5s;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  box-sizing: border-box;

  &--loaded {
    opacity: 1;
  }

  &__hero {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    position: relative;
    background-color: $codeBgColor;
    box-shadow: 0 0 50px 50px $codeBgColor inset;
    background-size: 40px 40px;
    background-image:
      linear-gradient(to right, #33363F 1px, transparent 1px),
      linear-gradient(to bottom, #33363F 1px, transparent 1px);
  }

  &__main {
    max-width: 100vw;
    display: flex;
    flex-direction: row;
    max-width: 860px;
  }

  &__logo {
    filter: drop-shadow(2px 1px 2px $shadowColor)
  }

  &__title {
    color: #fff;
    padding: 2rem;
    text-shadow: 2px 1px 3px $shadowColor;
  }

  &__title {
    h1, h3 {
      font-weight: normal;
    }
  }

  @media (max-width 720px) {
    &__main {
      flex-direction: column;
    }

    &__logo {
      margin: auto;
      width: 100%;
      max-width: 250px;
    }

    &__title {
      text-align: center;
    }
  }
}
</style>
