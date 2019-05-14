import draw2d from 'draw2d'
import Canvas from './Canvas'
import { Circuit } from '@aristotle/logic-circuit'
import Connection from './Connection'
import EditorModel from './models/EditorModel'
import DeserializerService from './services/DeserializerService'
import SerializerService from './services/SerializerService'
import OscillationService from './services/OscillationService'
import ElementInitializerService from './services/ElementInitializerService'
import uuid from './utils/uuid'

export default class Editor extends Canvas {
  constructor (elementId) {
    super(elementId)

    this.circuit = new Circuit()
    this.deserializer = new DeserializerService(this)
    this.serializer = new SerializerService(this)
    this.oscillation = new OscillationService(this)
    this.installEditPolicies()

    this.drawn = false
    this.setMouseMode('PANNING') // TODO: remove

    this.oscillation.start()
    // this.on('select', (...args) => {
    //   if (!this.drawn) {
    //     const serialized = JSON.stringify(this.serializer.serializeAll())
    //     // this.clear()

    //     setTimeout(() => {
    //       this.deserializer.deserialize(JSON.parse(serialized))
    //     }, 1000)
    //     this.drawn = true
    //   }
    // })
  }

  oscillate = (waves) => {
    this.fireEvent('oscillate', waves)
    // console.log('oscillating', waves)
  }

  /**
   * Adds a node to the Editor and its circuit instance.
   *
   * @param {Element} node - element node to add
   * @param {Number} x - x-axis screen coordinates to add the element at
   * @param {Number} y - y-axis screen coordinates to add the element at
   */
  addNode = (node, x, y) => {
    this.add(node, x, y)
    this.circuit.addNode(node.node)
    this.step(true)
  }


  addElement = (params, x, y) => {
    const element = ElementInitializerService
      .getInitializedElement(uuid(), params)

    this.addNode(element, x, y)// TODO: should be command
  }

  /**
   * Connects two elements together in the Editor and its circuit instance.
   *
   * @param {Element} source - source node
   * @param {Element} target - target node
   * @param {Number} index - input index at the target to connect to
   */
  addConnection = (source, target, index) => {
    const connection = new Connection(this.circuit)

    connection.setSource(source.getOutputPort(0))
    connection.setTarget(target.getInputPort(index))

    this.add(connection)
    this.step(true)
  }

  /**
   * Runs the circuit evaluation.
   * It will debug in a step-through manner if the `debug` property is set to `true`.
   * It will evaluate automatically until the circuit has no more updates.
   *
   * @param {Boolean} [force = false] - if true, forces the circuit to re-evaluate even if complete
   */
  step = (force = false) => {
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
  setMouseMode = (mode) => {
    switch (mode) {
      case 'PANNING':
        this.installEditPolicy(new draw2d.policy.canvas.PanningSelectionPolicy())
        break
      case 'SELECTION':
      default:
        this.installEditPolicy(new draw2d.policy.canvas.BoundingboxSelectionPolicy())
        break
    }
    this.mouseMode = mode
  }

  /**
   * Returns a new instance of a Connection.
   *
   * @returns {Connection}
   */
  createConnection = () => {
    return new Connection(this.circuit)
  }

  /**
   * Installs basic edit policies for the editor.
   *
   * @private
   */
  installEditPolicies = () => {
    const grid = new draw2d.policy.canvas.ShowGridEditPolicy()

    grid.setGridColor('#333641')

    this.installEditPolicy(grid)
    this.installEditPolicy(new draw2d.policy.connection.DragConnectionCreatePolicy({
      createConnection: this.createConnection
    }))
  }

  getEditorModel = () => {
    return new EditorModel({
      canUndo: this.commandStack.canUndo(),
      canRedo: this.commandStack.canRedo(),
      selectionCount: this.getSelection().getSize(),
      mouseMode: this.mouseMode,
      debug: this.debug
    })
  }

  updateElement = (payload) => {
    this
      .getPrimarySelection()
      .updateSettings(payload)
  }

  load = (data) => {
    this.deserializer.deserialize(data)
  }

  applyCommand = (command) => {
    switch (command.command) {
      case 'UNDO':
        try {
          this.commandStack.undo()
        } catch (e) {
          this.commandStack.redo()
          this.commandStack.undostack = []
          this.fireEvent('commandStackChanged')
        }
        break
      case 'REDO':
        try {
          this.commandStack.redo()
        } catch (e) {
          this.commandStack.undo()
          this.commandStack.redostack = []
          this.fireEvent('commandStackChanged')
        }
        break
      case 'CUT':
        console.log('not implemented')
        break
      case 'UPDATE_ELEMENT':
        this.updateElement(command.payload)
        break
    }
  }
}
