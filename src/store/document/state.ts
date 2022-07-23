import SimulationService from '@/services/SimulationService'

export interface DocumentState extends SerializableState {
  viewport: DOMRect
  canvas: BoundingBox
  oscilloscopeHeight: number
  hasLoaded: boolean
  cachedState: string | null
  undoStack: string[]
  redoStack: string[]
  snapBoundaries: BoundingBox[]
  connectablePortIds: string[]
  zoomLevel: number
  simulation: SimulationService
  oscillogram: Oscillogram
  isOscilloscopeOpen: boolean
  isOscilloscopeRecording: boolean
  isCircuitEvaluated: boolean
  isIntegratedCircuit: boolean
  isDebugging: boolean
  isDirty: boolean
  activeFreeportId: string | null
  selectedItemIds: string[]
  selectedConnectionIds: string[]
  selectedPortIndex: number
  zIndex: number
  activePortId: string | null
  connectionPreviewId: string | null
  isPrinting: boolean
  isCreatingImage: boolean
  animatePan: boolean
  debugger: {
    timeout: number
    hasUpdated: boolean
  }
}

export const state = (): DocumentState => ({
  undoStack: [],
  redoStack: [],
  simulation: new SimulationService([], [], {}),
  oscillogram: {},
  zoomLevel: 1,
  zIndex: 1,
  oscilloscopeHeight: 200,
  isOscilloscopeOpen: false,
  isOscilloscopeRecording: true,
  isCircuitEvaluated: false,
  isIntegratedCircuit: false,
  isDebugging: false,
  isDirty: false,
  hasLoaded: false,
  isPrinting: false,
  isCreatingImage: false,
  animatePan: false,

  /** debugger status */
  debugger: {
    timeout: 0,
    hasUpdated: false
  },

  /* canvas dimensions */
  viewport: new DOMRect(),
  canvas: {
    top: 0,
    left: 0,
    bottom: 0,
    right: 0
  },

  /* the following variables are 'temporary' information */
  snapBoundaries: [],
  connectablePortIds: [],
  selectedConnectionIds: [],
  selectedItemIds: [],
  selectedPortIndex: -1,
  cachedState: null,
  activeFreeportId: null,
  activePortId: null,
  connectionPreviewId: null,

  /* serializable state items */
  items: {},
  connections: {},
  ports: {},
  groups: {}
})
