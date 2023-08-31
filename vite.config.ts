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

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    build: {
      rollupOptions: {
        input: {
          index: fileURLToPath(new URL('public/index.html', import.meta.url)),
          splash: fileURLToPath(new URL('public/splash.html', import.meta.url)),
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
      electron([
        {
          // Main-Process entry file of the Electron App.
          entry: 'src/process/main.ts',
          onstart: options => options.startup(),
          vite: {
            build: {
              sourcemap: command === 'serve',
              minify: command === 'build',
              outDir: 'dist-electron/main',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {})
              },
            },
          },
        },
        {
          entry: 'src/process/preload.ts',
          onstart: options => options.reload(),
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        }
      ]),
      // Use Node.js API in the Renderer-process
      renderer(),
    ],
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
      return {
        host: url.hostname,
        port: +url.port,
      }
    })(),
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "@/styles/_globals.scss";
            @import "@/styles/_variables.scss";
          `
        }
      }
    },
    clearScreen: false,
  }
})
