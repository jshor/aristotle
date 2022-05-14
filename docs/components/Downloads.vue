<template>
  <div class="downloads">
    <a
      v-if="url && os === 'Windows'"
      :href="url"
      class="downloads__button"
    >
      Download {{ version }}
    </a>
    <div class="downloads__version">
      <a href="/demo/">Try online</a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Downloads',
  data () {
    return {
      version: null,
      url: null
    }
  },
  async created () {
    try {
      const slug = 'jshor/aristotle'
      const response = await fetch(`https://api.github.com/repos/${slug}/git/refs/tags`)
      const data = await response.json()

      this.version = data
        .map(({ ref }) => ref)
        .pop()
        .split('/')
        .pop()

      this.url = `https://github.com/${slug}/releases/download/${this.version}/Aristotle Setup ${this.version}.exe`
    } catch (error) {
      // oh well, we tried
    }
  },
  computed: {
    os () {
      if (typeof navigator === 'undefined')
        return null

      if (/^mac/i.test(navigator.platform))
        return 'Mac'

      if (/^win/i.test(navigator.platform))
        return 'Windows'
    }
  }
})
</script>

<style lang="scss">
$accentColor: #3eaf7c;
$textColor: #2c3e50;
$borderColor: #eaecef;
$codeBgColor: #1B1B23;
$shadowColor: #000000;

.downloads {
  padding-top: 0.5rem;
  display: flex;
  line-height: 2.5rem;
  height: 2.5rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }

  &__button {
    background-color: $accentColor;
    color: #fff;
    border-radius: 2rem;
    padding: 0 2rem;
    display: inline-block;
    text-shadow: 1px 1px 1px $shadowColor;
    box-shadow: 2px 1px 1px $shadowColor;
    transition: background-color 0.25s;

    &:hover {
      background-color: $textColor;
    }
  }

  &__version {
    color: $accentColor;
    text-align: center;
    flex: 1;

    a:hover {
      text-decoration: underline;
    }
  }

  &__os {
    filter: drop-shadow(1px 1px 1px $shadowColor);
    padding-right: 0.5em;
  }
}
</style>
