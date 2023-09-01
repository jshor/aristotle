import { defineStore } from 'pinia'
import { state, DocumentState } from './state'
import * as clipboardActions from './actions/clipboard'
import * as connectionActions from './actions/connection'
import * as editorActions from './actions/editor'
import * as freeportActions from './actions/freeport'
import * as groupingActions from './actions/grouping'
import * as itemActions from './actions/item'
import * as panningActions from './actions/panning'
import * as portActions from './actions/port'
import * as positioningActions from './actions/positioning'
import * as oscillatorActions from './actions/oscillator'
import * as rotationActions from './actions/rotation'
import * as selectionActions from './actions/selection'
import * as simulationActions from './actions/simulation'
import * as sizingActions from './actions/sizing'
import * as snappingActions from './actions/snapping'
import * as undoRedoActions from './actions/undoRedo'
import * as zIndexActions from './actions/zIndex'
import * as zoomingActions from './actions/zooming'
import sortByZIndex from '@/utils/sortByZIndex'

export const createDocumentStore = (documentId: string) => defineStore({
  id: documentId,
  state,
  getters: {
    baseItems (state) {
      return (Object
        .values(state.connections) as BaseItem[])
        .concat(Object.values(state.items) as BaseItem[])
        .sort(sortByZIndex)
    },

    zoom (state) {
      return state.zoomLevel
    },

    hasSelection (state) {
      return state.selectedItemIds.length > 0 || state.selectedConnectionIds.length > 0
    },

    hasSelectedItems (state) {
      return state.selectedItemIds.length > 0
    },

    selectedGroupIds (state) {
      const selectedGroupIds = new Set<string | null>()

      state
        .selectedItemIds
        .forEach(id => selectedGroupIds.add(state.items[id]?.groupId))

      return Array.from(selectedGroupIds)
    },

    canGroup () {
      return this.selectedGroupIds.length > 1 || [].slice.call(this.selectedGroupIds)[0] === null
    },

    canUngroup () {
      return !![].slice.call(this.selectedGroupIds).find(id => !!id)
    },

    canUndo (state) {
      return state.undoStack.length > 0
    },

    canRedo (state) {
      return state.redoStack.length > 0
    }
  },
  actions: {
    ...clipboardActions,
    ...connectionActions,
    ...editorActions,
    ...freeportActions,
    ...groupingActions,
    ...itemActions,
    ...panningActions,
    ...portActions,
    ...positioningActions,
    ...oscillatorActions,
    ...rotationActions,
    ...selectionActions,
    ...simulationActions,
    ...snappingActions,
    ...sizingActions,
    ...undoRedoActions,
    ...zIndexActions,
    ...zoomingActions
  }
})

export type DocumentStore = ReturnType<typeof createDocumentStore>

export type DocumentStoreInstance = ReturnType<DocumentStore>
