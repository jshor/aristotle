import { command, Port, Canvas } from 'draw2d'
import ElementInitializerService from './ElementInitializerService'
import getIdMapping from '../utils/getIdMapping'
import Editor from 'Editor'

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
  private editor: Editor
  private commandCollection: command.CommandCollection
  private elements: any // TODO
  private idMap: { [key: string]: string }

  /**
   * Constructor.
   *
   * @param {Editor} editor
   */
  constructor (editor) {
    this.editor = editor
  }

  /**
   * Deserializes the given data into elements and connections onto the editor.
   *
   * @param {Object} data - see data format for more details
   */
  deserialize = (data) => {
    this.commandCollection = new command.CommandCollection()
    this.idMap = getIdMapping(data.elements)
    this.elements = []

    data.elements.forEach(this.createElement)
    data.connections.forEach(this.createConnection)

    // console.log('editor: ', this.editor.getCommandStack())
    const editor: Canvas = this.editor as Canvas

    editor.getCommandStack().execute(this.commandCollection)
  }

  /**
   * Adds the element creation command to the list of commands.
   *
   * @param {Object} params
   * @param {Number} params.x - x-axis canvas value
   * @param {Number} params.y - y-axis canvas value
   * @param {String} params.id - element id
   */
  createElement = (params) => {
    const { x, y, id } = params
    const node = ElementInitializerService.getInitializedElement(this.idMap[id], params)

    this.elements.push(node)
    this.commandCollection.add(new command.CommandAdd(this.editor, node, x, y))
  }

  /**
   * Adds the connection creation command to the list of commands.
   *
   * @param {Object} params
   * @param {Number} params.inputId - id of the node having the source port
   * @param {Number} params.outputId - id of the node having the target port
   * @param {Number} params.sourceIndex - index of the input port
   * @param {Number} params.targetIndex - index of the target port
   */
  createConnection = ({ inputId, outputId, sourceIndex, targetIndex }) => {
    const sourceElement = this.getNodeById(this.idMap[inputId]) as Port
    const targetElement = this.getNodeById(this.idMap[outputId]) as Port

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
  getConnection = (source, target) => {
    const connection = this.editor.createConnection()

    connection.setSource(source)
    connection.setTarget(target)

    return connection
  }

  /**
   * Returns a node by its id.
   *
   * @param {String} id
   * @returns {Element}
   */
  getNodeById = (id) => {
    return this
      .elements
      .filter((node) => node.id === id)
      .pop()
  }
}
