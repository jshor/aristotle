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

    this.debugMode = false
    this.drawn = false
    this.oscilloscopeEnabled = false
  }

  oscillate = (waves, secondsElapsed) => {
    this.fireEvent('oscillate', { waves, secondsElapsed })
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


  createElement = (params, x, y) => {
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
   * It will debug in a step-through manner if the `debugMode` property is set to `true`.
   * It will evaluate automatically until the circuit has no more updates.
   *
   * @param {Boolean} [force = false] - if true, forces the circuit to re-evaluate even if complete
   */
  step = (force = false) => {
    if (!this.circuit.isComplete() || force) {
      this.circuit.next()

      if (!this.debugMode) {
        setTimeout(() => this.step())
      }
    }
    this.fireEvent('commandStackChanged')
  }

  toggleDebug = (debugMode) => {
    if (this.debugMode !== debugMode) {
      if (debugMode) {
        this.oscillation.stop()
      } else {
        this.oscillation.start()
      }
    }
    this.debugMode = debugMode
    this.fireEvent('commandStackChanged')
  }

  reset = () => {
    const serialized = JSON.stringify(this.serializer.serializeAll())

    this.clear()
    this.deserializer.deserialize(JSON.parse(serialized))
    this.drawn = true // TODO: ???
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
    this.fireEvent('commandStackChanged')
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
      debugMode: this.debugMode,
      oscilloscopeEnabled: this.oscilloscopeEnabled,
      zoomLevel: this.getZoom(),
      circuitComplete: this.circuit.isComplete() || false
    })
  }

  updateElement = ({ elementId, data }) => {
    this
      .getFigures()
      .asArray()
      .filter(({ id }) => elementId === id)[0]
      .updateSettings(data)
  }

  load = (data) => {
    this.deserializer.deserialize(data)
    this.centerAllFigures()
  }

  centerAllFigures = () => {
    const group = new draw2d.shape.composite.Group()
    const figures = this.getFigures()

    figures.each((i, figure) => {
      group.assignFigure(figure)
    })

    const x = (this.getWidth() - group.width) / 2
    const y = (this.getHeight() - group.height) / 2

    group.setX(x)
    group.setY(y)

    figures.each((i, figure) => {
      group.unassignFigure(figure)
    })
  
    this.remove(group)
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
      case 'SET_MOUSE_MODE':
        this.setMouseMode(command.payload)
        break
      case 'UPDATE_ELEMENT':
        this.updateElement(command.payload)
        break
      case 'TOGGLE_OSCILLATOR':
        this.oscilloscopeEnabled = !this.oscilloscopeEnabled
        this.fireEvent('commandStackChanged')
        break
      case 'TOGGLE_DEBUG':
        this.toggleDebug(!this.debugMode)
        break
      case 'STEP':
        this.step()
        this.fireEvent('commandStackChanged')
        break
      case 'RESET':
        this.reset()
        this.fireEvent('commandStackChanged')
        break
      case 'SET_ZOOM':
        console.log('ZOOM TO: ', command.payload)
        // this.setZoom(command.payload)
        this.doZoom(command.payload)
    }
  }

  panTo = (x, y) => {
    console.log('pan to: ', x, y)
    const {
      width,
      height
    } = this.parent.getBoundingClientRect()
    const z = 1 / this.getZoom()
    const panX = x * z
    const panY = y * z
    console.log('Pan: ', panX, panY, panX - width / 2, panY - height / 2)
    const left = Math.min(panX - width / 2, 0)
    const top = Math.min(panY - height / 2, 0)

    this.scrollTo(left, top)
  }

  doZoom = (factor) => {
    const { left, top, width, height } = this.parent.getBoundingClientRect()
    const z = this.getZoom()
    const x = (this.getScrollLeft() * z) + width / 2
    const y = (this.getScrollTop() * z) + height / 2
    const zoomDelta = factor * 0.25
    const zoomFactor = this.getZoom() + zoomDelta

    this.setZoom(zoomFactor)

    setTimeout(() => {
      this.panTo(x, y)
    })


    // this.paper.setViewBox(0, 0, this.initialWidth, this.initialHeight)
    // this.setZoom(factor)
    // const { top, left, width, height } = this.parent.getBoundingClientRect()
    // const { x, y } = left + width / 2
    // const y = top + height / 2
    // const before = this.fromDocumentToCanvasCoordinate(left + width / 2, top + height / 2)
    // this.setZoom(zoomFactor)
    // const after = this.fromDocumentToCanvasCoordinate(left + width / 2, top + height / 2)
    // const deltaX = (after.x - before.x) / zoomFactor
    // const deltaY = (after.y - before.y) / zoomFactor

    // console.log('DELTA: ', this.getWidth() * zoomFactor)
    // setTimeout(() => {
    //   this.scrollTo(this.getScrollLeft() - deltaX, this.getScrollTop() - deltaY)
    // }, 2000)





    // const x = left + width / 2
    // const y = top + height / 2
    // const wheelZoomPolicy = this
    //   .editPolicy
    //   .asArray()
    //   .filter(e => e instanceof draw2d.policy.canvas.ZoomPolicy)
    //   .pop()

   
    // while (auf > 0) {
    //   wheelZoomPolicy.onMouseWheel(-24, x, y, true)
    //   auf -= 3
    // }
    // wheelZoomPolicy.setZoom(1.25, true)

      // console.log('wee', wheelZoomPolicy)
    // this.setZoom(factor, true)
  }
}
