import { DocumentState } from "./state"

/**
 * Document zoom level.
 */
export function zoom (state: DocumentState) {
  return state.zoomLevel
}

export function totalSelectionCount (state: DocumentState) {
  return state.selectedItemIds.size +
    state.selectedConnectionIds.size +
    Object.keys(state.selectedControlPoints).length
}

export function canDelete (state: DocumentState) {
  return state.selectedItemIds.size > 0 ||
    state.selectedConnectionIds.size > 0 ||
    Object.keys(state.selectedControlPoints).length > 0
}
