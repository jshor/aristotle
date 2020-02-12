import Editor from '../core/Editor'

/**
 * @class CommandManager
 * @description Command manager for all requested UI commands.
 * @example ```
 *  const commandManager = new CommandManager(editor)
 *
 *  commandManager.applyCommand(command)
 * ```
 */
export default class CommandManager {
  public editor: Editor

  /**
   * Constructor.
   *
   * @param {Editor} editor
   */
  constructor (editor: Editor) {
    this.editor = editor
  }

  getApplicableEvent = (commandType: string): string => {
    switch (commandType) {
      case 'SET_MOUSE_MODE':
      case 'TOGGLE_DEBUG':
      case 'TOGGLE_OSCILLATOR':
        return 'config:changed'
      case 'UNDO':
      case 'REDO':
        return 'commandStack:changed'
      case 'RESET':
      case 'STEP':
        return 'circuit:changed'
    }
    return null
  }

  fireApplicableEvent = (commandType: string): void => {
    const eventName = this.getApplicableEvent(commandType)

    if (eventName) {
      console.log('FIRING: ', eventName)
      this.editor.fireEvent(eventName)
    }
  }

  applyCommand = (command): void => {
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
        this.editor
          .deserializer
          .updateSelectedElementProperties(command.payload)
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
