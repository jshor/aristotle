import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  rmSync('dist-electron', { recursive: true, force: true })

  const electronPlugins = [
    electron(
      ['main', 'preload'].map(name => ({
        entry: `src/process/${name}.ts`, // TODO: rename 'process' folder to 'app'
        onstart: options => options.startup(),
        vite: {
          build: {
            sourcemap: name === 'main'
              ? (command === 'serve')
              : (command === 'serve' ? 'inline' : undefined),
            minify: command === 'build',
            outDir: `dist-electron/${name}`,
            rollupOptions: {
              external: Object.keys('dependencies' in pkg ? pkg.dependencies : {})
            }
          }
        }
      }))
    ),
    renderer()
  ]

  return {
    build: {
      rollupOptions: {
        input: {
          index: fileURLToPath(new URL('public/index.html', import.meta.url)),
          splash: fileURLToPath(new URL('public/splash.html', import.meta.url))
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(path.resolve(__dirname), 'src')
      }
    },
    server: mode === 'web' ? {
      open: 'http://localhost:5173/index.html'
    } : undefined,
    plugins: [
      vue(),
      ...(mode === 'web' ? [] : electronPlugins)
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import '@/styles/_globals.scss';
            @import '@/styles/_variables.scss';
            @import '@/styles/_mixins.scss';
            @import '@/styles/_keyframes.scss';
          `
        }
      }
    },
    clearScreen: false
  }
})
