import draw2d from 'draw2d'
import Canvas from './Canvas'
import { Circuit } from '@aristotle/logic-circuit'
import Connection from './Connection'
import Element from './Element'
import CommandModel from '@/models/CommandModel'
import Command from '@/types/Command'
import EditorModel from '@/models/EditorModel'
import MouseMode from '@/types/MouseMode'

export default class Editor extends Canvas {
  public circuit: Circuit = new Circuit()
  public debug: boolean = false
  public commandStack: draw2d.CommandStack
  public mouseMode: MouseMode = MouseMode.PANNING

  constructor (elementId: string) {
    super(elementId)

    this.circuit = new Circuit()
    this.installEditPolicies()
  }

  /**
   * Adds a node to the Editor and its circuit instance.
   *
   * @param {Element} node - element node to add
   * @param {Number} x - x-axis screen coordinates to add the element at
   * @param {Number} y - y-axis screen coordinates to add the element at
   */
  public addNode (node: Element, x: number, y: number): void {
    super.add(node, x, y)
    this.circuit.addNode(node.node)
    this.step(true)
  }

  /**
   * Connects two elements together in the Editor and its circuit instance.
   *
   * @param {Element} source - source node
   * @param {Element} target - target node
   * @param {Number} index - input index at the target to connect to
   */
  public addConnection = (source: Element, target: Element, index: number): void => {
    const connection = new Connection(this.circuit)

    connection.setSource(source.getOutputPort(0))
    connection.setTarget(target.getInputPort(index))

    super.add(connection)
    this.step(true)
  }

  /**
   * Runs the circuit evaluation.
   * It will debug in a step-through manner if the `debug` property is set to `true`.
   * It will evaluate automatically until the circuit has no more updates.
   *
   * @param {Boolean} [force = false] - if true, forces the circuit to re-evaluate even if complete
   */
  public step = (force: boolean = false): void => {
    if (!this.circuit.isComplete() || force) {
      this.circuit.next()

      if (!this.debug) {
        setTimeout(() => this.step())
      }
    }
  }

  /**
   * Sets the mouse mode of the editor.
   *
   * @param {MouseMode} mode - valid values are: PANNING or SELECTION
   */
  public setMouseMode (mode: MouseMode): void {
    switch (mode) {
      case MouseMode.PANNING:
        super.installEditPolicy(new draw2d.policy.canvas.PanningSelectionPolicy())
        break
      case MouseMode.SELECTION:
      default:
        super.installEditPolicy(new draw2d.policy.canvas.BoundingboxSelectionPolicy())
        break
    }
    this.mouseMode = mode
  }

  /**
   * Returns a new instance of a Connection.
   *
   * @returns {Connection}
   */
  public createConnection = (): Connection => {
    return new Connection(this.circuit)
  }

  /**
   * Installs basic edit policies for the editor.
   *
   * @private
   */
  private installEditPolicies = (): void => {
    super.installEditPolicy(new draw2d.policy.canvas.ShowGridEditPolicy())
    super.installEditPolicy(new draw2d.policy.connection.DragConnectionCreatePolicy({
      createConnection: this.createConnection
    }))
  }

  public getEditorModel = (): EditorModel => {
    return new EditorModel({
      canUndo: this.commandStack.canUndo(),
      canRedo: this.commandStack.canRedo(),
      selectionCount: super.getSelection().getSize(),
      mouseMode: this.mouseMode,
      debug: this.debug
    })
  }

  public applyCommand = (command: CommandModel) => {
    switch (command.command) {
      case Command.UNDO:
        console.log('will undo')
        this.commandStack.undo()
        break
      case Command.REDO:
        this.commandStack.redo()
        break
    }
  }
}
