declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, T>
  export default component
}

declare module 'vue3-smooth-dnd' {
  export { Container } from 'vue3-smooth-dnd'
  export { Draggable } from 'vue3-smooth-dnd'
}

