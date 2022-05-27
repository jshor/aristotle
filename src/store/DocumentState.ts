import SimulationService from '@/services/SimulationService'

export default interface DocumentState {
  viewport: DOMRect
  canvas: BoundingBox
  oscilloscopeHeight: number
  hasLoaded: boolean
  cachedState: string | null
  undoStack: string[]
  redoStack: string[]
  snapBoundaries: BoundingBox[]
  connectablePortIds: string[]
  ports: Record<string, Port>
  items: Record<string, Item>
  connections: Record<string, Connection>
  groups: Record<string, Group>
  taxonomyCounts: Record<string, number>
  zoomLevel: number
  simulation: SimulationService
  oscillogram: Oscillogram
  isOscilloscopeOpen: boolean
  isCircuitEvaluated: boolean
  isDebugging: boolean
  isDirty: boolean
  isToolboxOpen: boolean
  activeFreeportId: string | null
  selectedItemIds: string[]
  selectedConnectionIds: string[]
  selectedPortIndex: number
  zIndex: number
  activePortId: string | null
  connectionPreviewId: string | null
  isPrinting: boolean
  isCreatingImage: boolean
}
