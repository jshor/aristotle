import Editor from '../core/Editor'
import { Command } from '../types'
import ICommand from '../interfaces/ICommand'
import ManagerBase from './ManagerBase'

/**
 * @class CommandManager
 * @description Command manager for all requested UI commands.
 */
export default class CommandManager extends ManagerBase {
  /**
   * Performs user-requested functionality on the Editor for the given Command.
   *
   * @param {ICommand} command - user-defined command
   */
  applyCommand = ({ type, payload }: ICommand): void => {
    switch (type) {
      case Command.Undo:
        this.editor.undo()
        break
      case Command.Redo:
        this.editor.redo()
        break
      case Command.SetMouseMode:
        this.editor.setMouseMode(payload)
        break
      case Command.UpdateElementProperties:
        this.editor
          .deserializer
          .updateElementProperties(payload)
        break
      case Command.ToggleOscilloscope:
        this.editor.toggleOscilloscope()
        break
      case Command.SetDebugger:
        this.editor.toggleDebug(!this.editor.debugMode)
        break
      case Command.TriggerCircuitStep:
        this.editor.step()
        break
      case Command.ResetCircuit:
        this.editor.reset()
        break
      case Command.SetZoomLevel:
        this.editor.viewportManager.setZoomLevel(payload)
        break
    }

    this.fireApplicableEvent(type)
  }

  /**
   * Returns the relevant event for the given command type.
   *
   * @param {Command} commandType
   * @returns {string}
   */
  private getApplicableEvent = (commandType: Command): string => {
    switch (commandType) {
      case Command.SetMouseMode:
      case Command.SetDebugger:
      case Command.ToggleOscilloscope:
      case Command.SetActivity:
        return 'config:changed'
      case Command.Undo:
      case Command.Redo:
        return 'commandStack:changed'
      case Command.ResetCircuit:
      case Command.TriggerCircuitStep:
        return 'circuit:changed'
    }
    return null
  }

  /**
   * Fires the relevant event for the given command type.
   *
   * @param {Command} commandType
   */
  fireApplicableEvent = (commandType: Command): void => {
    const eventName = this.getApplicableEvent(commandType)

    if (eventName) {
      this.editor.fireEvent(eventName)
    }
  }
}
