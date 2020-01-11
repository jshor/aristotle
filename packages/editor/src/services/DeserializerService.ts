import { command, Port, Canvas } from 'draw2d'
import ElementInitializerService from './ElementInitializerService'
import getIdMapping from '../utils/getIdMapping'
import Editor from '../core/Editor'
import Connection from 'core/Connection'

/**
 * @class DeserializerService
 * @description Deserializes data onto the editor. See data params in documentation
 *  for construction of the serialized object.
 * @example ```
 *  const deserializer = new DeserializerService(editor)
 *
 *  deserializer.deserialize(data)
 * ```
 */
export default class DeserializerService {
  /**
   * Editor instance.
   *
   * @type {Editor}
   */
  private editor: Editor

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
   * Constructor.
   *
   * @param {Editor} editor
   */
  constructor (editor: Editor) {
    this.editor = editor
  }

  /**
   * Deserializes the given circuit data into elements and connections onto the editor.
   *
   * @param {CircuitDefinition} circuitData
   */
  public deserialize = (circuitData: CircuitDefinition): void => {
    const editor: Canvas = this.editor as Canvas

    this.commandCollection = new command.CommandCollection()
    this.idMap = getIdMapping(circuitData.elements)
    this.elements = []

    circuitData.elements.forEach(this.createElement)
    circuitData.connections.forEach(this.createConnection)

    editor.getCommandStack().execute(this.commandCollection)
  }

  /**
   * Adds the element creation command to the list of commands.
   *
   * @param {CircuitElement} element
   */
  createElement = (element: CircuitElement): void => {
    const { x, y, id } = element
    const node = ElementInitializerService.getInitializedElement(this.idMap[id], element)

    this.elements.push(node)
    this.commandCollection.add(new command.CommandAdd(this.editor, node, x, y))
  }

  /**
   * Adds the connection creation command to the list of commands.
   *
   * @param {CircuitConnection} circuitConnection
   */
  private createConnection = (connection: CircuitConnection): void => {
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
   * Connects two elements together in the Editor and its circuit instance.
   *
   * @param {Editor} editor
   * @param {draw2d.Port} source - source port
   * @param {draw2d.Port} target - target port
   * @returns {draw2d.Connection}
   */
  private getConnection = (source: Port, target: Port): Connection => {
    const connection = this.editor.createConnection()

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
