class EditorModel {
  constructor ({
    canUndo = false,
    canRedo = false,
    debugMode = false,
    circuitComplete = false,
    oscilloscopeEnabled = false,
    selectionCount = 0,
    zoomLevel = 1,
    mouseMode = 'SELECTION'
  }) {
    this.canUndo = canUndo
    this.canRedo = canRedo
    this.debugMode = debugMode
    this.selectionCount = selectionCount
    this.mouseMode = mouseMode
    this.oscilloscopeEnabled = oscilloscopeEnabled
    this.zoomLevel = zoomLevel
    this.circuitComplete = circuitComplete
  }
}

export default EditorModel
