export declare enum PortFlow {
  Input = 'input',
  Output = 'output'
}

export declare enum GateType {
  AND = 'AND',
  OR = 'OR',
  NAND = 'NAND',
  NOR = 'NOR',
  XOR = 'XOR',
  XNOR = 'XNOR',
  NOT = 'NOT'
}

export declare type PortDefinition = {
  x: number
  y: number
  type: string
}

export declare type PortLabel = {
  label: string,
  type: string
}

export declare type PortSchematic = {
  top: PortLabel[]
  left: PortLabel[]
  bottom: PortLabel[]
  right: PortLabel[]
}

export declare type CircuitElement = {
  id: string
  type: string
  nodeType?: string // TODO: rename
  portIndex?: number
  name: string
  x: number
  y: number
}

export declare type CircuitConnection = {
  inputId: string
  outputId: string
  sourceIndex: number
  targetIndex: number
}

export declare type CircuitDefinition = {
  name: string
  ports: PortSchematic
  elements: CircuitElement[]
  connections: CircuitConnection[]
}

export declare type SerializedCircuit = {
  elements: CircuitElement[]
  connections: CircuitConnection[]
}

export declare type SvgData = {
  path: string
  ports: PortDefinition[]
  width: number
  height: number
}

export declare type Point = {
  x: number
  y: number
}

export declare type IdMap = {
  [key: string]: string
}
