import { Canvas, Figure } from 'draw2d'
import Element from '../core/Element'
import Connection from '../core/Connection'
import { SerializedCircuit } from '../types'
import ManagerBase from './ManagerBase'

/**
 * @class SerializationManager
 * @description Service for serializing items in the given Editor.
 * This service has the ability to serialize either all items or selected ones only.
 */
export default class SerializationManager extends ManagerBase {
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
    const elements = this.canvas.getFigures().asArray()
    const connections = this.canvas.getLines().asArray()

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

    this
      .canvas
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
