import SimulationService from '@/services/SimulationService'

export default interface DocumentState {
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
  oscilloscope: OscilloscopeInfo
  isOscilloscopeEnabled: boolean
  isCircuitEvaluated: boolean
  activeFreeportId: string | null
  selectedItemIds: string[]
  selectedConnectionIds: string[]
  selectedPortIndex: number
  zIndex: number
  activePortId: string | null
  connectionPreviewId: string | null
}
