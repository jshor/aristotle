import { MouseMode } from '../types'

export default interface IEditorModel {
  canUndo: boolean
  canRedo: boolean
  debugMode: boolean
  circuitComplete: boolean
  oscilloscopeEnabled: boolean
  selectionCount: number
  zoomLevel: number
  mouseMode: MouseMode
}
