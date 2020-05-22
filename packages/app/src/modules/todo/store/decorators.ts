import { createDecorator, VueDecorator } from 'vue-class-component'
import { ComponentOptions } from 'vue'

export function Getter (moduleName: string, getterName: string): VueDecorator {
  return createDecorator((options: ComponentOptions<Vue>, key: string, index: number): void => {
    if (options.computed === undefined) {
      options.computed = {}
    }
    options.computed[key] = function(this: Vue) {
      return this.$store.getters[getterName]
    }
  })
}

export function Action (moduleName: string, actionName: string): VueDecorator {
  return createDecorator((options: ComponentOptions<Vue>, key: string, index: number): void => {
    if (options.methods === undefined) {
      options.methods = {}
    }
    options.methods[key] = function(this: Vue) {
      // console.log('this.$store.dispatch: ', this.$store.dispatch[actionName])
      return (this.$store.dispatch as any).bind(this, actionName)
    }
  })
}
