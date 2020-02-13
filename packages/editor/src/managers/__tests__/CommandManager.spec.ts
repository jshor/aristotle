import CommandManager from '../CommandManager'
import Editor from '../../core/Editor'
import { Command, MouseMode } from '../../types'

jest.mock('../../core/Editor')

describe('CommandManager', () => {
  let manager
  let editor

  beforeEach(() => {
    editor = new Editor('testElement')
    manager = new CommandManager(editor)
  })

  afterEach(() => jest.resetAllMocks())

  describe('applyCommand()', () => {
    beforeEach(() => {
      editor.deserializer = {
        updateElementProperties: jest.fn()
      }
      editor.viewportManager = {
        setZoomLevel: jest.fn()
      }
      editor.undo = jest.fn()
      editor.redo = jest.fn()
      editor.setMouseMode = jest.fn()
      editor.toggleOscilloscope = jest.fn()
      editor.toggleDebug = jest.fn()
      editor.step = jest.fn()
      editor.reset = jest.fn()
    })

    it('should call `undo()` for the command type `Undo`', () => {
      const spy = jest.spyOn(editor, 'undo')

      manager.applyCommand({ type: Command.Undo })

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should call `redo()` for the command type `Redo`', () => {
      const spy = jest.spyOn(editor, 'redo')

      manager.applyCommand({ type: Command.Redo })

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should call `setMouseMode()` with the given payload for the command type `SetMouseMode`', () => {
      const spy = jest.spyOn(editor, 'setMouseMode')

      manager.applyCommand({
        type: Command.SetMouseMode,
        payload: MouseMode.Panning
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(MouseMode.Panning)
    })

    it('should call `updateElementProperties()` with the given element properties for the command type `UpdateElementProperties`', () => {
      const spy = jest.spyOn(editor.deserializer, 'updateElementProperties')
      const properties = { foo: 'bar' }

      manager.applyCommand({
        type: Command.UpdateElementProperties,
        payload: properties
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(properties)
    })

    it('should call `toggleOscilloscope()` for the command type `ToggleOscilloscope`', () => {
      const spy = jest.spyOn(editor, 'toggleOscilloscope')

      manager.applyCommand({ type: Command.ToggleOscilloscope })

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should call `toggleDebug()` with the inverse value of `debugMode` for the command type `SetDebugger`', () => {
      const spy = jest.spyOn(editor, 'toggleDebug')

      editor.debugMode = true

      manager.applyCommand({ type: Command.SetDebugger })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(false)
    })

    it('should call `step()` for the command type `TriggerCircuitStep`', () => {
      const spy = jest.spyOn(editor, 'step')

      manager.applyCommand({ type: Command.TriggerCircuitStep })

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should call `reset()` for the command type `ResetCircuit`', () => {
      const spy = jest.spyOn(editor, 'reset')

      manager.applyCommand({ type: Command.ResetCircuit })

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('should call `setZoomLevel()` with the given zoom level for the command type `SetZoomLevel`', () => {
      const spy = jest.spyOn(editor.viewportManager, 'setZoomLevel')
      const zoomLevel = 1.5

      manager.applyCommand({
        type: Command.SetZoomLevel,
        payload: zoomLevel
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(zoomLevel)
    })
  })
})
