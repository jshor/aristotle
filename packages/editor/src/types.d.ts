declare enum PortFlow {
  Input = 'input',
  Output = 'output'
}

declare enum GateType {
  AND = 'AND',
  OR = 'OR',
  NAND = 'NAND',
  NOR = 'NOR',
  XOR = 'XOR',
  XNOR = 'XNOR',
  NOT = 'NOT'
}

type PortDefinition = {
  x: number
  y: number
  type: string
}

type PortLabel = {
  label: string,
  type: string
}

type PortSchematic = {
  top: PortLabel[]
  left: PortLabel[]
  bottom: PortLabel[]
  right: PortLabel[]
}

type CircuitElement = {
  id: string
  type: string
  nodeType?: string // TODO: rename
  portIndex?: number
  name: string
  x: number
  y: number
}

type CircuitConnection = {
  inputId: string
  outputId: string
  sourceIndex: number
  targetIndex: number
}

type CircuitDefinition = {
  name: string
  ports: PortSchematic
  elements: any // TODO
  connections: any
}

type SvgData = {
  path: string
  ports: PortDefinition[]
  width: number
  height: number
}

type Point = {
  x: number
  y: number
}
