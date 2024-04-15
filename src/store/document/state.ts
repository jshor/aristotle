import SerializableState from '@/types/interfaces/SerializableState'
import BoundingBox from '@/types/types/BoundingBox'
import Circuit from './circuit'
import CircuitNode from './circuit/CircuitNode'
import Oscillator from './oscillator'
import Oscillogram from '@/types/types/Oscillogram'
import Point from '@/types/interfaces/Point'
import { DocumentStatus } from '@/types/enums/DocumentStatus'

export interface DocumentState extends SerializableState {
  /** Current document status. */
  status: DocumentStatus
  /** The boundaries encompassing the canvas. */
  viewport: DOMRect
  /** The boundaries of the canvas. This is usually larger han the viewport size. */
  canvas: BoundingBox
  /** The height, in pixels, of the oscilloscope panel. */
  oscilloscopeHeight: number
  /** The width, in pixels, of the oscilloscope timeline labels column. */
  oscilloscopeWidth: number
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
  connectablePortIds: Set<string>
  /** The percentage level of zoom (e.g., 0.2 = 20%, 1.2 = 120%). */
  zoomLevel: number
  /** Whether or not the oscilloscope viewer panel is open. */
  isOscilloscopeOpen: boolean
  /**
   * Whether or not the circuit has finished computing its state.
   * If the debugger is on, this will be false until the user has finished stepping through the circuit.
   */
  isCircuitEvaluated: boolean
  /** Whether or not the debugger is on. */
  isDebugging: boolean
  /** Whether or not the document is dirty (i.e., has unsaved changes). */
  isDirty: boolean
  /** List of port IDs that are requested by the user to be monitored. */
  monitoredPortIds: Set<string>
  /** List of IDs of selected items. */
  selectedItemIds: Set<string>
  /** List of IDs of selected wires. */
  selectedConnectionIds: Set<string>
  /** List of IDs of selected groups. */
  selectedGroupIds: Set<string>
  /** Mapping of selected connection IDs to their respective sets of selected control point indices. */
  selectedControlPoints: Record<string, Set<number>>
  /** The index number of the selected port, with respect to its item. */
  selectedPortIndex: number
  /** The maximal z-index value of all items in the document. */
  zIndex: number
  /** The ID of the actively-dragged item port. */
  activePortId: string | null
  /** The ID of the actively-dragged preview connection. */
  connectionPreviewId: string | null
  /**
   * Information about the connection "experiment" (i.e., when a user drags a port to try to establish a new connection).
   * `null` when no experiment is being performed.
   *
   * The connection experiment is rendered by [PortItem.vue](../../containers/PortItem.vue).
   */
  connectionExperiment: {
    /** The ID of the port originating the experiment. */
    sourceId: string
    /** The current position of the target end of the experimenting wire. */
    targetPosition: Point
  } | null
  /** Whether or not to animate panning. */
  panningAnimationFrameId: number
  /** Mapping of port IDs to their respective virtual circuit nodes. */
  nodes: Record<string, CircuitNode>
  /** Logical circuit instance. */
  circuit: Circuit
  /** Circuit oscillator. */
  oscillator: Oscillator
  /** Oscillogram data, containing each BinaryWave instance observed in the oscilloscope. */
  oscillogram: Oscillogram
  /** A promise that resolves once the editor has successfully loaded. */
  loadPromise?: Promise<void>
  /** Resolution function for {@link loadPromise}. */
  loadResolver?: () => void
}

export const state = (): DocumentState => ({
  status: DocumentStatus.Ready,
  undoStack: [],
  redoStack: [],
  oscillogram: {},
  zoomLevel: 1,
  zIndex: 1,
  oscilloscopeHeight: 200,
  oscilloscopeWidth: 100,
  isOscilloscopeOpen: false,
  isCircuitEvaluated: false,
  isDebugging: false,
  isDirty: false,
  hasLoaded: false,
  panningAnimationFrameId: 0,

  nodes: {},
  circuit: new Circuit(),
  oscillator: new Oscillator(),

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
  monitoredPortIds: new Set<string>(),
  connectablePortIds: new Set<string>(),
  selectedConnectionIds: new Set<string>(),
  selectedItemIds: new Set<string>(),
  selectedGroupIds: new Set<string>(),
  selectedControlPoints: {},
  selectedPortIndex: -1,
  cachedState: null,
  activePortId: null,
  connectionPreviewId: null,
  connectionExperiment: null,

  /* serializable state items */
  items: {},
  connections: {},
  ports: {},
  groups: {}
})
