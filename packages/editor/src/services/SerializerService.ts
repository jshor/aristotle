import { Canvas, Figure } from 'draw2d'
import Element from '../core/Element'
import Connection from '../core/Connection'
import { SerializedCircuit } from '../types'

/**
 * Service for serializing items in the given Editor.
 * This service has the ability to serialize either all items or selected ones only.
 */
export default class SerializerService {
  /**
   * Instance of the Draw2D canvas.
   *
   * @type {draw2d.Canvas}
   */
  private editor: Canvas

  constructor (editor) {
    this.editor = editor
  }

  /**
   * Returns a serialized circuit for the given elements and connections.
   *
   * @returns {SerializedCircuit}
   */
  private serialize = (elements: Element[], connections: Connection[]): SerializedCircuit => {
    return {
      elements: elements.map(e => e.serialize()),
      connections: connections.map(c => c.serialize())
    }
  }

  /**
   * Serializes all items in the Editor.
   *
   * @returns {SerializedCircuit}
   */
  public serializeAll = (): SerializedCircuit => {
    const elements = this.editor.getFigures().asArray()
    const connections = this.editor.getLines().asArray()

    return this.serialize(elements, connections)
  }

  /**
   * Serializes the selected items in the Editor.
   *
   * @returns {SerializedCircuit}
   */
  public serializeSelection = (): SerializedCircuit => {
    const elements: Element[] = []
    const connections: Connection[] = []

    this.editor
      .getSelection()
      .getAll()
      .asArray()
      .forEach((figure: Figure) => {
        if (figure instanceof Connection) {
          connections.push(figure)
        } else {
          elements.push(figure)
        }
      })

    return this.serialize(elements, connections)
  }
}
