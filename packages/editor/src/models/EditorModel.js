class EditorModel {
  constructor ({
    canUndo = false,
    canRedo = false,
    debug = false,
    selectionCount = 0,
    mouseMode = 'PANNING'
  }) {
    this.canUndo = canUndo
    this.canRedo = canRedo
    this.debug = debug
    this.selectionCount = selectionCount
    this.mouseMode = mouseMode
  }
}

export default EditorModel
