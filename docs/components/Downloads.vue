<template>
  <div class="downloads">
    <template v-if="url && isPlatformSupported">
      <a
        :href="url"
        class="downloads__button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="downloads__icon"
          :viewBox="`0 0 ${icon.width} ${icon.height}`"
        >
          <path fill="currentColor" :d="icon.svgPath" />
        </svg>
        Download {{ version }}
      </a>
      <div class="downloads__version">
        <a href="/web/">Try online</a>
      </div>
    </template>

    <template v-else>
      <a
        href="/web/"
        class="downloads__button"
      >
        Try it online
      </a>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from 'vue'
import { faApple, faLinux, faWindows } from '@fortawesome/free-brands-svg-icons'

export default defineComponent({
  name: 'Downloads',
  setup () {
    const slug = 'jshor/aristotle'
    const isPlatformSupported = computed(() => /^win/i.test(navigator.platform))
    const version = ref('')
    const url = ref('')
    const icon = computed(() => {
      const { icon } = (() => {
        if (/^mac/i.test(navigator.platform)) return faApple
        if (/^win/i.test(navigator.platform)) return faWindows
        return faLinux
      })()

      return {
        width: icon[0],
        height: icon[1],
        svgPath: icon[4] as string
      }
    })

    onMounted(async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${slug}/git/refs/tags`)
        const data = await response.json()

        version.value = data
          .map(({ ref }) => ref)
          .pop()
          .split('/')
          .pop()
        url.value = `https://github.com/${slug}/releases/download/${version.value}/Aristotle.Setup.${version.value}.exe`
      } catch (_) {
        return ''
      }
    })

    return {
      icon,
      isPlatformSupported,
      url,
      version
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
  line-height: 3rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }

  &__button {
    background-color: $accentColor;
    color: #fff;
    border-radius: 2rem;
    padding: 0 2rem;
    display: inline-flex;
    align-items: center;
    text-shadow: 1px 1px 1px $shadowColor;
    box-shadow: 2px 1px 1px $shadowColor;
    transition: background-color 0.25s;

    &:hover {
      background-color: $textColor;
      text-decoration: none !important;
    }
  }

  &__icon {
    max-width: 100%;
    max-height: 100%;
    width: 2rem;
    height: 2rem;
    margin-right: 0.5rem;
    filter: drop-shadow( 1px 1px 1px $shadowColor);
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
