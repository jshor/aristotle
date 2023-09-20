import { defaultTheme, defineUserConfig } from 'vuepress'
import registerComponentsPlugin from '@vuepress/plugin-register-components'
import path from 'path'

export default defineUserConfig({
  theme: defaultTheme({
    logo: '/assets/logo.svg',
  }),
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
  description: 'The open-source digital logic simulator for Windows, Linux, and Mac.'
})
