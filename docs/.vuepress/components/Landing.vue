<template>
  <div>
    <div class="landing" :class="{ 'landing--loaded': loaded }">
      <section class="landing__hero">
        <div class="landing__main">
          <div class="landing__logo">
            <img src="/assets/logo.svg" />
          </div>
          <div class="landing__title">
            <h1>Build, simulate and debug digital logic circuits.</h1>
            
            <a href="/app/index.html" class="downloads__button">Try online</a>

            <span class="downloads__version">v0.9.0</span>
          </div>
        </div>

        <hook type="dark" />
        <hook type="light" />
      </section>
    </div>
  </div>
</template>

<script>
import Hook from './Hook'

export default {
  name: 'Landing',
  components: { Hook },
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
}
</script>

<style>
.landing {
  opacity: 0;
  transition: opacity 0.5s;
}

.landing--loaded {
  opacity: 1;
}

.downloads__button {
  height: 2.5rem;
  background-color: #3eaf7c;
  color: #fff;
  border-radius: 2rem;
  line-height: 2.5rem;
  padding: 0 2rem;
  display: inline-block;
  text-shadow: none;
  text-transform: uppercase;
  box-shadow: 2px 1px 1px #000;
  transition: background-color 0.25s;
}

.downloads__button:hover {
  background-color: #4A906A;
}

.downloads__version {
  color: #3eaf7c;
  padding-left: 2.5rem;
}

.landing {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  box-sizing: border-box;
}

.landing__hero {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  position: relative;
  background-color: #1B1C24;
  box-shadow: 0 0 50px 50px #1B1C24 inset;
  background-size: 40px 40px;
  background-image: linear-gradient(to right, #33363F 1px, transparent 1px), 
      linear-gradient(to bottom, #33363F 1px, transparent 1px);
}

.landing__main {
  max-width: 800px;
  display: flex;
  flex-direction: row;
}

.landing__logo {
  filter: drop-shadow( 2px 1px 2px #1B1B23);
}

.landing__title {
  color: #fff;
  padding: 2rem;
  text-shadow: 2px 1px 3px #000;
}

.landing__title h1 {
  font-weight: normal;
}

@media (max-width: 720px) {
  .landing__main {
    flex-direction: column;
  }

  .landing__logo {
    margin: auto;
    width: 100%;
    max-width: 250px;
  }

  .landing__title {
    text-align: center;
  }
}
</style>