import { createStore, GetterTree } from 'vuex'
import SimulationService from '@/services/SimulationService'
import actions from './actions'
import mutations from './mutations'
import DocumentState from './DocumentState'

const state: DocumentState = {
  cachedState: null,
  activeFreeportId: null,
  undoStack: [],
  redoStack: [],
  snapBoundaries: [],
  connectablePortIds: [],
  selectedConnectionIds: [],
  selectedItemIds: [],
  simulation: new SimulationService([], [], {}),
  waves: {
    waves: {},
    secondsElapsed: 0,
    secondsOffset: 0
  },
  items: {},
  connections: {},
  ports: {},
  groups: {},
  taxonomyCounts: {},
  zoomLevel: 1,
  selectedPortIndex: -1,
  zIndex: 1,
  activePortId: null,
  previewConnectedPortId: null
}

const getters: GetterTree<DocumentState, DocumentState> = {
  zoom (state) {
    return state.zoomLevel
  },

  items (state) {
    return Object
      .keys(state.items)
      .map((itemId: string) => ({
        ...state.items[itemId],
        id: itemId,
        ports: state
          .items[itemId]
          .portIds
          .map((portId: string) => state.ports[portId])
      }))
  },

  hasSelection (state) {
    return state.selectedItemIds.length > 0 && state.selectedConnectionIds.length > 0
  },

  hasSelectedItems () {
    return state.selectedItemIds.length > 0
  },

  selectedGroupIds (state) {
    const selectedGroupIds = new Set<string | null>()

    state
      .selectedItemIds
      .forEach(id => selectedGroupIds.add(state.items[id]?.groupId))

    return Array.from(selectedGroupIds)
  },

  canGroup (state, getters) {
    return getters.selectedGroupIds.length > 1 || getters.selectedGroupIds[0] === null
  },

  canUngroup (state, getters) {
    return !!getters.selectedGroupIds.find(id => !!id)
  },

  canUndo (state) {
    return state.undoStack.length > 0
  },

  canRedo (state) {
    return state.redoStack.length > 0
  }
}

export default createStore({
  state,
  mutations,
  getters,
  actions
})
