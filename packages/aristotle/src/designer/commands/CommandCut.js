import draw2d from 'draw2d'
import SerializationService from '@/services/SerializationService'

class CommandCut extends draw2d.command.Command {
  constructor (canvas) {
    super()
    this.clipboard = canvas.clipboard
    this.data = null
  }

  canExecute = () => {
    return true
  }

  execute = () => {
    this.data = this.clipboard.getSerializedSelection()
    this.clipboard.deleteSelection()
  }

  undo = () => {
    this.clipboard.setDeserializedSelection(this.data)
  }

  redo = () => {
    this.execute()
  }
}

export default CommandCut