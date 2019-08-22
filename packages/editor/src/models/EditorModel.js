class EditorModel {
  constructor ({
    canUndo = false,
    canRedo = false,
    debugMode = false,
    circuitComplete = false,
    oscilloscopeEnabled = false,
    selectionCount = 0,
    mouseMode = 'PANNING'
  }) {
    this.canUndo = canUndo
    this.canRedo = canRedo
    this.debugMode = debugMode
    this.selectionCount = selectionCount
    this.mouseMode = mouseMode
    this.oscilloscopeEnabled = oscilloscopeEnabled
    this.circuitComplete = circuitComplete
  }
}

export default EditorModel
