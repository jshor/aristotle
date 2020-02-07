import { util } from 'draw2d'
import Editor from '../core/Editor'

export default class ClipboardService {
  private editor: Editor

  constructor (editor: Editor) {
    this.editor = editor
  }

  copy = (): void => {
    const data = this
      .editor
      .serializer
      .serializeSelection()

    const encodedData = btoa(JSON.stringify(data))

    localStorage.setItem('clipboard', encodedData)
  }

  paste = (): void => {
    try {
      const raw = atob(localStorage.getItem('clipboard'))
      const data = JSON.parse(raw)

      // move the elements in the raw data 10 pixels to the right and bottom
      data.elements = data
        .elements
        .map((element) => ({
          ...element,
          x: element.x + 10,
          y: element.y + 10
        }))

      this.editor.deserializer.deserialize(data)
      this.deselectAll()
    } catch (error) {
      // do nothing, we ignore the error
    }
  }

  deselectAll = (): void => {
    this
      .editor
      .getCanvasInstance()
      .setCurrentSelection(new util.ArrayList())
  }

  selectAll = (): void => {
    const canvas = this.editor.getCanvasInstance()

    canvas.addSelection(canvas.getFigures())
    canvas.addSelection(canvas.getLines())
  }
}
