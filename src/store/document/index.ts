import { StoreGetters, defineStore } from 'pinia'
import { DocumentState, state } from './state'
import * as clipboardActions from './actions/clipboard'
import * as connectionActions from './actions/connection'
import * as editorActions from './actions/editor'
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
import * as getters from './getters'
import sortByZIndex from '@/utils/sortByZIndex'
import BaseItem from '@/types/interfaces/BaseItem'
import Item from '@/types/interfaces/Item'
import Connection from '@/types/interfaces/Connection'

export const createDocumentStore = (documentId: string) => defineStore({
  id: documentId,
  state,
  getters: {
    ...getters,

    baseItems (state) {
      return (Object
        .values(state.connections) as BaseItem[])
        .concat(Object.values(state.items) as BaseItem[])
        .sort(sortByZIndex)
    },

    hasSelection (state) {
      return state.selectedItemIds.size > 0 || state.selectedConnectionIds.size > 0
    },

    hasSelectedItems (state) {
      return state.selectedItemIds.size > 0
    },

    canGroup (state) {
      let ungroupedCount = 0
      let groupedCount = 0

      const hasUngrouped = (list: Set<string>, map: Record<string, Connection | Item>) => {
        for (const id of list) {
          map[id].groupId
            ? groupedCount++
            : ungroupedCount++

          if (ungroupedCount > 1 || (groupedCount && ungroupedCount)) {
            // at least two items are ungrouped, or at least one item is grouped and at least one item is ungrouped
            return true
          }
        }

        return false
      }

      return hasUngrouped(state.selectedItemIds, state.items) || hasUngrouped(state.selectedConnectionIds, state.connections)
    },

    canUngroup (state) {
      return state.selectedGroupIds.size > 0
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
