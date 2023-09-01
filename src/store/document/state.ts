import { CircuitNode, Circuit } from '@/circuit'
import OscillationService from '@/services/OscillationService'
import Oscillogram from '@/types/types/Oscillogram'

export interface DocumentState extends SerializableState {
  /** The boundaries encompassing the canvas. */
  viewport: DOMRect
  /** The boundaries of the canvas. This is usually larger han the viewport size. */
  canvas: BoundingBox
  /** The height, in pixels, of the oscilloscope panel. */
  oscilloscopeHeight: number
  /** Whether or not the document has finished loading its contents. */
  hasLoaded: boolean
  /** The current serialized state. */
  cachedState: string | null
  /** List of undoable states. */
  undoStack: string[]
  /** List of redoable states. */
  redoStack: string[]
  /** List of bounding boxes to inform the actively-dragged item to snap to align to. */
  snapBoundaries: BoundingBox[]
  /** List of all IDs of ports that can be connected to the actively-dragged wire. */
  connectablePortIds: string[]
  /** The percentage level of zoom (e.g., 0.2 = 20%, 1.2 = 120%). */
  zoomLevel: number
  /** Whether or not the oscilloscope viewer panel is open. */
  isOscilloscopeOpen: boolean
  /** Whether or not the oscilloscope is recording waves. */
  isOscilloscopeRecording: boolean
  /**
   * Whether or not the circuit has finished computing its state.
   * If the debugger is on, this will be false until the user has finished stepping through the circuit.
   */
  isCircuitEvaluated: boolean
  /** Whether or not the debugger is on. */
  isDebugging: boolean
  /** Whether or not the document is dirty (i.e., has unsaved changes). */
  isDirty: boolean
  /** The ID of the actively-dragged freeport. */
  activeFreeportId: string | null
  /** List of IDs of selected items. */
  selectedItemIds: string[]
  /** List of IDs of selected wires. */
  selectedConnectionIds: string[]
  /** The index number of the selected port, with respect to its item. */
  selectedPortIndex: number
  /** The maximal z-index value of all items in the document. */
  zIndex: number
  /** The ID of the actively-dragged item port. Does not apply to freeports. */
  activePortId: string | null
  /** The ID of the actively-dragged preview connection. */
  connectionPreviewId: string | null
  /** Whether or not the computer is printing the document. */
  isPrinting: boolean
  /** Whether or not an image is being rendered from the document. */
  isCreatingImage: boolean
  /** Whether or not to animate panning. */
  animatePan: boolean
  /** Mapping of port IDs to their respective virtual circuit nodes. */
  nodes: Record<string, CircuitNode>
  /** Logical circuit instance. */
  circuit: Circuit
  /** Circuit oscillator. */
  oscillator: OscillationService
  /** Oscillogram data, containing each BinaryWave instance observed in the oscilloscope. */
  oscillogram: Oscillogram
}

export const state = (): DocumentState => ({
  undoStack: [],
  redoStack: [],
  oscillogram: {},
  zoomLevel: 1,
  zIndex: 1,
  oscilloscopeHeight: 200,
  isOscilloscopeOpen: false,
  isOscilloscopeRecording: true,
  isCircuitEvaluated: false,
  isDebugging: false,
  isDirty: false,
  hasLoaded: false,
  isPrinting: false,
  isCreatingImage: false,
  animatePan: false,

  nodes: {},
  circuit: new Circuit(),
  oscillator: new OscillationService(),

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
