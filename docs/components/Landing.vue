<template>
  <div>
    <div class="landing" :class="{ 'landing--loaded': loaded }">
      <div class="landing__main">

        <downloads />

        <div class="landing__image-wrapper">
          <img class="landing__image" aria-hidden="true" src="/assets/screenshot.png" />
        </div>

        <section class="landing__section">
          <!-- <h3>Aristotle allows you to graphically arrange components together to build digital logic circuits.</h3> -->
          <!-- <h3>Its powerful built-in debugger and oscilloscope enable you to visualize and understand your circuits.</h3> -->
        </section>
      </div>
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

html, body {
  font-family: Inter,sans-serif!important;
  background-color: $codeBgColor;
  --c-bg: $codeBgColor;
}

.homepage {

  // position: absolute;
  display: block;
  // top: 0;
  // left: 0;
  width: 100%;
  height: 100vh;
  background-color: $codeBgColor;
  box-shadow: 0 0 100px 100px $codeBgColor inset;
  background-image: url('/assets/download.svg');
  z-index: 0;
}

.landing {
  opacity: 0;
  transition: opacity 0.5s;
  display: flex;
  box-sizing: border-box;
  text-align: center;

  &--loaded {
    opacity: 1;
  }


  &__main {
    justify-content: center;
    flex: 1;
    position: relative;
  }

  &__section {
    max-width: 955px;
    margin: auto;

    h3 {
      margin-bottom: 3rem;
      letter-spacing: -.06em;
      line-height: 1.2;
      font-size: 3rem;
      background: -webkit-linear-gradient(#f2f4f8,#4bc567);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      text-align: left;
      font-weight: bold;
    }
  }

  &__image {
    object-fit: cover;
    object-position: center;
    width: 100%;
    border-radius: 0.5rem;
    border: 2px solid #333;
    box-sizing: border-box;
    filter: drop-shadow(0 0 4rem rgba(255, 255, 255, 0.1));
  }

  &__image-wrapper {
    margin: auto;
    max-width: 1400px;
    padding: 2rem;
    box-sizing: border-box;
  }
}
</style>
