/**
 * @class CommandService
 * @description Command manager for all requested UI commands.
 * @example ```
 *  const commandService = new CommandService(editor)
 *
 *  commandService.applyCommand(command)
 * ```
 */
export default class CommandRouterService {
  /**
   * Constructor.
   *
   * @param {Editor} editor
   */
  constructor (editor) {
    this.editor = editor
  }

  getApplicableEvent = (commandType) => {
    switch (commandType) {
      case 'SET_MOUSE_MODE':
      case 'TOGGLE_DEBUG':
      case 'TOGGLE_OSCILLATOR':
        return 'userOptionChanged'
      case 'UNDO':
      case 'REDO':
        return 'commandStackChanged'
      case 'RESET':
      case 'STEP':
        return 'circuitUpdated'
    }
    return null
  }

  fireApplicableEvent = (commandType) => {
    const eventName = this.getApplicableEvent(commandType)

    if (eventName) {
      console.log('FIRING: ', eventName)
      this.editor.fireEvent(eventName)
    }
  }

  applyCommand = (command) => {
    switch (command.command) {
      case 'UNDO':
        this.editor.undo()
        break
      case 'REDO':
        this.editor.redo()
        break
      case 'SET_MOUSE_MODE':
        this.editor.setMouseMode(command.payload)
        break
      case 'UPDATE_ELEMENT':
        this.editor.updateElement(command.payload)
        break
      case 'TOGGLE_OSCILLATOR':
        this.editor.toggleOscilloscope()
        break
      case 'TOGGLE_DEBUG':
        this.editor.toggleDebug(!this.editor.debugMode)
        break
      case 'STEP':
        this.editor.step()
        break
      case 'RESET':
        this.editor.reset()
        break
      case 'SET_ZOOM':
        this.editor.zoomService.setZoomLevel(command.payload)
        break
    }

    this.fireApplicableEvent(command.command)
  }
}
