import { defineUserConfig } from 'vuepress'
import { registerComponentsPlugin } from '@vuepress/plugin-register-components'
import path from 'path'

export default defineUserConfig({
  base: '/',
  dest: 'build',
  head: [
    ['link', {
      rel: 'icon',
      href: '/assets/logo.svg'
    }]
  ],
  plugins: [
    registerComponentsPlugin({
      components: {
        Downloads: path.resolve(__dirname, './docs/components/Downloads.vue'),
        Hook: path.resolve(__dirname, './docs/components/Hook.vue'),
        Landing: path.resolve(__dirname, './docs/components/Landing.vue')
      }
    })
  ],
  lang: 'en-US',
  title: 'Aristotle',
  description: 'The digital logic simulator.'
})
