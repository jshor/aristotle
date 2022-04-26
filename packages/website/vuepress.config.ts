import { defineUserConfig } from 'vuepress'
import { registerComponentsPlugin } from '@vuepress/plugin-register-components'
import path from 'path'

export default defineUserConfig({
  base: '/',
  dest: path.join(__dirname, '../../build'),
  head: [
    ['link', {
      rel: 'icon',
      href: '/assets/logo.svg'
    }]
  ],
  plugins: [
    registerComponentsPlugin({
      components: {
        Downloads: path.resolve(__dirname, './components/Downloads.vue'),
        Hook: path.resolve(__dirname, './components/Hook.vue'),
        Landing: path.resolve(__dirname, './components/Landing.vue')
      }
    })
  ],
  lang: 'en-US',
  title: 'Aristotle',
  description: 'The digital logic simulator.'
})
