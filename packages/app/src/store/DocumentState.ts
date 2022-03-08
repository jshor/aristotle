import SimulationService from '@/services/SimulationService'

export default interface DocumentState {
  cachedState: string | null
  undoStack: string[]
  redoStack: string[]
  snapBoundaries: BoundingBox[]
  connectablePortIds: string[]
  ports: {
    [id: string]: Port
  }
  items: {
    [id: string]: Item
  }
  connections: {
    [id: string]: Connection
  }
  groups: {
    [id: string]: Group
  }
  zoomLevel: number
  simulation: SimulationService
  waves: any,
  activeFreeportId: string | null
}
