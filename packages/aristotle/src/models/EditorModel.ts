import MouseMode from '@/types/MouseMode'

class EditorModel {
  public canUndo: boolean
  public canRedo: boolean
  public debug: boolean
  public selectionCount: number
  public mouseMode: MouseMode

  constructor ({
    canUndo = false,
    canRedo = false,
    debug = false,
    selectionCount = 0,
    mouseMode = MouseMode.PANNING
  }) {
    this.canUndo = canUndo
    this.canRedo = canRedo
    this.debug = debug
    this.selectionCount = selectionCount
    this.mouseMode = mouseMode
  }
}

export default EditorModel
