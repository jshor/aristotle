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
  zoomLevel: 1
}

const getters: GetterTree<DocumentState, DocumentState> = {
  zoom (state) {
    return state.zoomLevel
  },

  ports (state) {
    return state.ports
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

  connections (state) {
    const { ports } = state

    return Object
      .values(state.connections)
      .map(wire => ({
        ...wire,
        source: ports[wire.source],
        target: ports[wire.target]
      }))
      .filter(({ source, target }) => source && target)
  },

  selectedItemsData (state) {
    return Object
      .values(state.items)
      .reduce((selection, item: Item) => {
        if (!item.isSelected) return selection

        return {
          type: selection.type && selection.type !== item.type
            ? 'Mixed'
            : item.type,
          count: selection.count + 1
        }
      }, { type: '', count: 0 })
  },

  selectedConnectionsCount (state) {
    return Object
      .values(state.connections)
      .filter(({ isSelected }) => isSelected)
      .length
  },

  selectedGroupsCount (state) {
    return Object
      .values(state.connections)
      .filter(({ isSelected }) => isSelected)
      .length
  },

  nextZIndex (state) {
    return Object.keys(state.items).length + Object.keys(state.connections).length
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
