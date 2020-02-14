import { command, Port } from 'draw2d'
import getIdMapping from '../utils/getIdMapping'
import Connection from '../core/Connection'

import Element from '../core/Element'
import Switch from '../elements/Switch'
import Clock from '../elements/Clock'
import LogicGate from '../elements/LogicGate'
import Lightbulb from '../elements/Lightbulb'
import Digit from '../elements/Digit'
import IntegratedCircuit from '../elements/IntegratedCircuit'

import {
  CircuitConnection,
  CircuitDefinition,
  CircuitElement,
  ElementPropertyValues,
  IdMap
} from '../types'
import ManagerBase from './ManagerBase'

/**
 * @class DeserializationManager
 * @description Deserializes data onto the editor. See data params in documentation
 *  for construction of the serialized object.
 */
export default class DeserializationManager extends ManagerBase {
  /**
   * List of queued `CommandAdd` commands to invoke.
   *
   * @type {draw2d.command.CommandCollection}
   */
  private commandCollection: command.CommandCollection

  /**
   * List of elements in the Editor.
   *
   * @type {Element[]}
   */
  private elements: Element[]

  /**
   * Mapping of old Element ids to new ones.
   *
   * @type {IdMap}
   */
  private idMap: IdMap

  /**
   * Deserializes the given circuit data into elements and connections onto the editor.
   *
   * @param {CircuitDefinition} circuitData
   */
  public deserialize = (circuitData: CircuitDefinition): void => {
    this.commandCollection = new command.CommandCollection()
    this.idMap = getIdMapping(circuitData.elements)
    this.elements = []

    circuitData.elements.forEach(this.createElement)
    circuitData.connections.forEach(this.createConnection)

    this.executeAllCommands()
  }

  /**
   * Executes all queued commands in the CommandCollection.
   */
  public executeAllCommands = (): void => {
    this
      .canvas
      .commandStack
      .execute(this.commandCollection)

    // reset the command collection
    this.commandCollection = new command.CommandCollection()
  }

  /**
   * Adds the element creation command to the list of commands.
   *
   * @param {CircuitElement} element
   */
  public createElement = (element: CircuitElement): void => {
    const { x, y, id, type, properties } = element
    const node = this.getInitializedElement(this.idMap[id] || id, type, properties)

    this.elements.push(node)
    this.commandCollection.add(new command.CommandAdd(this.editor, node, x, y))
  }

  /**
   * Adds the connection creation command to the list of commands.
   *
   * @param {CircuitConnection} circuitConnection
   */
  public createConnection = (connection: any): void => {
    const { inputId, outputId, sourceIndex, targetIndex } = connection
    const sourceElement = this.getElementById(this.idMap[inputId]) as Port
    const targetElement = this.getElementById(this.idMap[outputId]) as Port

    const source = sourceElement.getOutputPort(sourceIndex)
    const target = targetElement.getInputPort(targetIndex)

    // port is not yet added to the canvas, so this would ordinarily return null
    // force getCanvas() to return the editor, as it is called by CommandConnect
    target.getCanvas = () => this.editor

    const cmd = new command.CommandConnect(source, target)

    cmd.setConnection(this.getConnection(source, target))

    this.commandCollection.add(cmd)
  }

  /**
   * Initializes the element based on its type.
   *
   * @param {string} id - element id
   * @param {ElementPropertyValues} properties - configurable element properties
   * @returns {Element}
   */
  public getInitializedElement = (id: string, type: string, properties: ElementPropertyValues): any => {
    switch (type) {
      case 'IntegratedCircuit':
        return new IntegratedCircuit(id, properties as CircuitDefinition)
      case 'Clock':
        return new Clock(id, properties)
      case 'Switch':
        return new Switch(id, properties)
      case 'LogicGate':
        return new LogicGate(id, properties)
      case 'Lightbulb':
        return new Lightbulb(id, properties)
      case 'Digit':
        return new Digit(id, properties)
      default:
        return new Element(id, properties)
    }
  }

  /**
   * Updates properties on the selected element(s).
   */
  updateElementProperties = (properties: ElementPropertyValues, elementId?: string) => {
    const elements: Element[] = this
      .canvas
      .getFigures()
      .asArray()

    // elements
    //   .filter(({ id }) => elementId === id)[0]
    //   .updateSettings(data)
  }

  /**
   * Connects two elements together in the Editor and its circuit instance.
   *
   * @param {Editor} editor
   * @param {draw2d.Port} source - source port
   * @param {draw2d.Port} target - target port
   * @returns {draw2d.Connection}
   */
  private getConnection = (source: Port, target: Port): Connection => {
    const connection = new Connection(this.editor.circuit)

    connection.setSource(source)
    connection.setTarget(target)

    return connection
  }

  /**
   * Returns an element by its id.
   *
   * @param {String} id
   * @returns {Element}
   */
  private getElementById = (id: string): Element => {
    return this
      .elements
      .filter((node: Element): boolean => node.id === id)
      .pop()
  }
}
