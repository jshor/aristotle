import { Canvas } from 'draw2d'
import Editor from '../core/Editor'

export default class ManagerBase {
  public canvas: Canvas

  public editor: Editor

  constructor (editor: Editor) {
    this.canvas = editor as Canvas
    this.editor = editor
  }
}
