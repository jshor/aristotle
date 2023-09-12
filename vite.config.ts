import { rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  rmSync('dist-electron', { recursive: true, force: true })

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
    plugins: [
      vue(),
      electron(
        ['main', 'preload'].map(name => ({
          entry: `src/process/${name}.ts`,
          onstart: options => options.startup(),
          vite: {
            build: {
              sourcemap: command === 'serve',
              minify: command === 'build',
              outDir: `dist-electron/${name}`,
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {})
              }
            }
          }
        }))
      ),
      // Use Node.js API in the Renderer-process
      renderer()
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import '@/styles/_globals.scss';
            @import '@/styles/_variables.scss';
          `
        }
      }
    },
    clearScreen: false
  }
})
