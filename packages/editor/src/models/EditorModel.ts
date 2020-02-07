class EditorModel {
  public canUndo: boolean
  public canRedo: boolean
  public debugMode: boolean
  public circuitComplete: boolean
  public oscilloscopeEnabled: boolean
  public selectionCount: number
  public zoomLevel: number
  public mouseMode: string
  public hasSelectedElements: boolean
  constructor ({
    canUndo = false,
    canRedo = false,
    debugMode = false,
    circuitComplete = false,
    oscilloscopeEnabled = false,
    selectionCount = 0,
    zoomLevel = 1,
    mouseMode = 'SELECTION',
    hasSelectedElements = false
  }) {
    this.canUndo = canUndo
    this.canRedo = canRedo
    this.debugMode = debugMode
    this.selectionCount = selectionCount
    this.mouseMode = mouseMode
    this.oscilloscopeEnabled = oscilloscopeEnabled
    this.zoomLevel = zoomLevel
    this.circuitComplete = circuitComplete
    this.hasSelectedElements = hasSelectedElements
  }
}

export default EditorModel
