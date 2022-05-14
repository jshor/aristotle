/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, T>
  export default component
}

declare global {
  interface Window {
    api: any
  }
}
