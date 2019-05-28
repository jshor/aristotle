<template>
  <div class="downloads">
    <a href="/app/index.html" class="downloads__button">
      <icon
        v-if="os"
        :icon="['fab', os]"
        class="downloads__os"
      />
      <span>Try online</span>
      <span v-if="version">v{{ version }}</span>
    </a>
    <div class="downloads__version">
      <a href="#">Other versions</a>
    </div>
  </div>
</template>

<script>
import { library } from '@fortawesome/fontawesome-svg-core'
import { faGithub, faWindows, faApple, faLinux } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon as Icon } from '@fortawesome/vue-fontawesome'

library.add(faGithub, faWindows, faApple, faLinux)

export default {
  name: 'Downloads',
  components: { Icon },
  data () {
    return {
      version: null
    }
  },
  async created () {
    try {
      const response = await fetch('https://api.github.com/repos/jshor/aristotle/git/refs/tags')
      const data = await response.json()

      this.version = data
        .map(({ ref }) => ref)
        .pop()
        .split('/')
        .pop()
    } catch (error) {
      // oh well, we tried
    }
  },
  methods: {
    getIcon () {
      switch (this.os) {
        case 'Mac':
          return 'apple'
        default:
          return this.os.toLowerCase()
      }
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
}
</script>

<style lang="stylus">
.downloads
  padding-top 0.5rem
  display flex
  line-height 2.5rem
  height 2.5rem

  @media (max-width 720px)
    flex-direction column

  &__button
    background-color $accentColor
    color #fff
    border-radius 2rem
    padding 0 2rem
    display inline-block
    text-shadow 1px 1px 1px $shadowColor
    box-shadow 2px 1px 1px $shadowColor
    transition background-color 0.25s

    &:hover
      background-color $textColor

  &__version
    color $accentColor
    text-align center
    flex 1

    a:hover
      text-decoration underline

  &__os
    filter drop-shadow(1px 1px 1px $shadowColor)
    padding-right 0.5em
</style>