import draw2d from 'draw2d'

export default class CommandSetProperty extends draw2d.command.Command {
  constructor (figure) {
    super()

    this.figure = figure
  }

  canExecute = () => {
    return true
  }

  execute = () => {
    this.redo()
  }

  undo = () => {
    this.figure.settings[this.propertyName].value = this.oldValue

    this.invokeEvent()
  }

  redo = () => {
    this.oldValue = this.figure.settings[this.propertyName].value
    this.figure.settings[this.propertyName].value = this.newValue

    this.invokeEvent()
  }

  invokeEvent = () => {
    if (this.callback) {
      this.callback()
    }
  }
}