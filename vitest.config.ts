import { defineConfig } from 'vitest/config'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import { createRequire } from 'module'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['./src/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      all: true,
      allowExternal: false,
      include: ['**/src/**']
    }
  },
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

global.require = createRequire(import.meta.url)
