import draw2d from 'draw2d'
import SerializationService from '@/services/SerializationService'

class CommandCut extends draw2d.command.Command {
  constructor (canvas) {
    super()
    this.clipboard = canvas.clipboard
    this.state = null
  }

  canExecute = () => {
    return true
  }

  execute = () => {
    this.state = this.clipboard.getCurrentState()
    this.clipboard.deleteSelection()
  }

  undo = () => {
    this.clipboard.setCurrentState(this.state)
    this.state = this.clipboard.getCurrentState()
  }

  redo = () => {
    this.clipboard.setCurrentState(this.state)
    this.state = this.clipboard.getCurrentState()
  }
}

export default CommandCut