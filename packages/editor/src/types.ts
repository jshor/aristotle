import IElementProperties from './interfaces/IElementProperties'
import IPulse from './interfaces/IPulse'

export declare const enum PortFlow {
  Input = 'input',
  Output = 'output'
}

export declare const enum GateType {
  AND = 'AND',
  OR = 'OR',
  NAND = 'NAND',
  NOR = 'NOR',
  XOR = 'XOR',
  XNOR = 'XNOR',
  NOT = 'NOT'
}

export declare const enum MouseMode {
  Panning = 'Panning',
  Selection = 'Selection'
}

export declare const enum Command {
  Redo = 'Redo',
  ResetCircuit = 'ResetCircuit',
  SetActivity = 'SetActivity',
  SetDebugger = 'SetDebugger',
  SetMouseMode = 'SetMouseMode',
  SetZoomLevel = 'SetZoomLevel',
  ToggleOscilloscope = 'ToggleOscilloscope',
  TriggerCircuitStep = 'TriggerCircuitStep',
  Undo = 'Undo',
  UpdateElementProperties = 'UpdateElementProperties'
}

export declare type PortDefinition = {
  x: number
  y: number
  type: string
}

export declare type PortLabel = {
  label: string,
  type: string,
  elementId?: string
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
  name?: string // TODO: name should be removed -- it is an element property
  properties: ElementPropertyValues
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

export declare type ScreenPoint = {
  top: number
  left: number
}

export declare type PropertiesDialogPayload = {
  elementId: string,
  properties: IElementProperties,
  position: Point
}

export declare type IdMap = {
  [key: string]: string
}

export declare type KeyValuePair = {
  [key: string]: string | number
}

export declare type WaveList = {
  [key: string]: IPulse
}

export declare type ElementPropertyValues = CircuitDefinition | KeyValuePair
