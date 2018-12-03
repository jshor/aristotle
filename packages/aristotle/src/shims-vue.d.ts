declare module '*.vue' {
  import Vue from 'vue'
  export default Vue
}

declare module 'draw2d' {
  // @ts-ignore
  export { policy, util, Connection, Port, Canvas, layout, geo, shape } from 'draw2d'
}

declare module '@aristotle/logic-circuit' {
  // @ts-ignore
  export { Circuit, CircuitNode, InputNode, OutputNode, Nor, Or, LogicValue } from '@aristotle/logic-circuit'
}


declare module '@aristotle/logic-gates' {
  // @ts-ignore
  export { renderIc, renderGate } from '@aristotle/logic-circuit'
}
