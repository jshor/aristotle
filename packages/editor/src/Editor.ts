import draw2d from 'draw2d'
import $ from 'jquery'
import { Circuit } from '@aristotle/logic-circuit'
import Connection from './Connection'
import EditorModel from './models/EditorModel'
import DeserializerService from './services/DeserializerService'
import SerializerService from './services/SerializerService'
import OscillationService from './services/OscillationService'
import CommandRouterService from './services/CommandRouterService'
import ElementInitializerService from './services/ElementInitializerService'
import ZoomService from './services/ZoomService'
import uuid from './utils/uuid'

export default class Editor extends draw2d.Canvas {
  public circuit: Circuit = new Circuit()

  public deserializer: DeserializerService = new DeserializerService(this)

  public serializer: SerializerService = new SerializerService(this)

  public oscillation: OscillationService = new OscillationService(this)

  public commandRouter: CommandRouterService = new CommandRouterService(this)

  public zoomService: ZoomService = new ZoomService(this)

  public debugMode: boolean = false

  public oscilloscopeEnabled: boolean = false

  public mouseMode: string = 'PANNING'


  public wrapper: HTMLElement
  public parent: HTMLElement
  public html: HTMLElement[]
  public mouseDown: boolean = false
  public mouseDownX: number = 0
  public mouseDownY: number = 0
  public mouseDragDiffX: number = 0
  public mouseDragDiffY: number = 0
  public zoomFactor: number = 1
  public editPolicy: any // draw2d.util.ArrayList
  public currentHoverFigure: any

  constructor (elementId) {
    super(elementId)

    this.wrapper = this.html[0]
    this.parent = this.wrapper.parentNode as HTMLElement
    super.setScrollArea(this.parent)
    this.registerEventListeners()
    this.installEditPolicies()
    console.log('works')
    // $("body").append(`
    // <svg style="position: absolute; width: 1px; height: 1px">
    // <filter id="filter-0" width="1" height="1"><feOffset in="SourceAlpha" dx="1" dy="1" result="1"></feOffset><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0 " in="1" result="2"></feColorMatrix><feGaussianBlur stdDeviation="2" in="2" result="3"></feGaussianBlur><feMerge in="3" result="4"><feMergeNode in="3"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>
    // </svg>
    // `)

    // this.html.on("touchend", (event) => {
    //   event = this._getEvent(event)

    //   if(this.mouseDownX === event.clientX || this.mouseDownY === event.clientY){
    //     console.log('ROUTING CLICK')
    //     var pos = this.fromDocumentToCanvasCoordinate(event.clientX, event.clientY);
    //     this.onClick(pos.x, pos.y, event.shiftKey, event.ctrlKey);
    //   }
    // })
  }

  /**
   * Registers the user interaction event listeners.
   */
  registerEventListeners = () => {
    document.addEventListener('mousemove', this.onBoundlessMouseMove)
    document.addEventListener('mouseup', this.onBoundlessMouseUp)
    super.getCommandStack().addEventListener(() => this.fireEvent('commandStackChanged'))
    super.on('unselect', this.onDeselect)
  }

  /**
   * Fires `toolbox.close` when the canvas is clicked and no elements are actively selected.
   *
   * @emits `deselect`
   * @emits `toolbox.close`
   */
  onDeselect = () => {
    if (super.getSelection().getSize() === 0) {
      this.fireEvent('toolbox.close')
    }
  }

  /**
   * Returns the absolute X position in the document of the parent wrapper.
   *
   * @override {draw2d.Canvas.getAbsoluteX}
   * @returns {Number}
   */
  getAbsoluteX = () => $(this.parent).offset().left

  /**
   * Returns the absolute Y position in the document of the parent wrapper.
   *
   * @override {draw2d.Canvas.getAbsoluteY}
   * @returns {Number}
   */
  getAbsoluteY = () => $(this.parent).offset().top

  /**
   * Fires mousedrag events if the mouse is down for any document movement.
   * This fixes the draw2d issue of being unable to change the boundary when the mouse leaves the canvas.
   *
   * @emits `mousemove`
   * @param {MouseEvent} event
   */
  onBoundlessMouseMove = (event) => {
    if (this.mouseDown) {
      const { clientX, clientY, shiftKey, ctrlKey } = event
      const { x, y } = super.fromDocumentToCanvasCoordinate(clientX, clientY)
      const diffXAbs = (clientX - this.mouseDownX) * this.zoomFactor
      const diffYAbs = (clientY - this.mouseDownY) * this.zoomFactor
      const diffX = diffXAbs - this.mouseDragDiffX
      const diffY = diffYAbs - this.mouseDragDiffY
      const hoverFigure = this.currentHoverFigure

      this.editPolicy.each((i, policy) => {
        policy.onMouseDrag(this, diffXAbs, diffYAbs, diffX, diffY, shiftKey, ctrlKey)
      })
      this.mouseDragDiffX = diffXAbs
      this.mouseDragDiffY = diffYAbs
      this.fireEvent('mousemove', { x, y, shiftKey, ctrlKey, hoverFigure })
    }
  }

  /**
   * Fires mouseup events if the mouse is down for any document movement.
   * This fixes the draw2d issue of having DOM movements get "stuck" when the mouse leaves the canvas.
   *
   * @param {MouseEvent} event
   */
  onBoundlessMouseUp = (event) => {
    if (this.mouseDown) {
      super.calculateConnectionIntersection()

      this.mouseDown = false
      const { x, y } = super.fromDocumentToCanvasCoordinate(event.clientX, event.clientY)

      this.editPolicy.each((i, policy) => {
        policy.onMouseUp(this, x, y, event.shiftKey, event.ctrlKey)
      })

      this.mouseDragDiffX = 0
      this.mouseDragDiffY = 0
    }
  }

  /**
   * Handles a toolbox drop event.
   *
   * @override {draw2d.Canvas.onDrop}
   * @param {HTMLElement} el
   */
  onDrop = (el) => {
    const rect = this.parent.getBoundingClientRect()
    const { clientX, clientY } = this.getDomEvent()

    const isInViewport = (
      clientX >= rect.left &&
      clientY >= rect.top &&
      clientX <= rect.right &&
      clientY <= rect.bottom
    )

    if (isInViewport) {
      const { x, y } = this.getDraggedCoordinates()
      const data = el.data()

      this.createElement({
        type: data.type,
        ...JSON.parse(atob(data.params))
      }, x, y)
    }
  }

  /**
   * Returns the document coordinates of the active-dragged toolbox element.
   *
   * @returns {Object} x, y coordinates
   */
  getDraggedCoordinates = () => {
    const { left, top } = $('.ui-draggable-dragging').offset()

    return super.fromDocumentToCanvasCoordinate(left, top)
  }

  fromCanvasToDocumentCoordinate = (x, y) => {
    const coords = super.fromCanvasToDocumentCoordinate(x, y)

    coords.x -= this.getAbsoluteX()
    coords.y -= this.getAbsoluteY()

    return coords
  }

  /**
   * Returns the most recent Canvas DOM event.
   *
   * @returns {Event}
   */
  getDomEvent = (): MouseEvent => event as MouseEvent

  public fireEvent = (eventName: string, payload: any = null): void  => {
    super.fireEvent(eventName, payload)
  }

  public oscillate = (waves, secondsElapsed) => {
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
    super.add(node, x, y)
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

    super.add(connection)
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
    this.fireEvent('circuitChanged')
  }

  /**
   * Updates the circuit debugger flags.
   * Starts oscillation (i.e., animation) when debugging mode is on.
   * Stops oscillation when debugging mode is off.
   *
   * @param {Boolean} debugMode
   */
  toggleDebug = (debugMode) => {
    if (this.debugMode !== debugMode) {
      if (debugMode) {
        this.oscillation.stop()
      } else {
        this.oscillation.start()
      }
    }
    this.debugMode = debugMode
  }

  toggleOscilloscope = () => {
    this.oscilloscopeEnabled = !this.oscilloscopeEnabled
  }

  /**
   * Resets the circuit by re-drawing it. Each circuit element will re-initialize to its original value.
   */
  reset = () => {
    const serialized = JSON.stringify(this.serializer.serializeAll())

    super.clear()
    this.deserializer.deserialize(JSON.parse(serialized))
  }

  /**
   * Sets the mouse mode of the editor.
   *
   * @param {MouseMode} mode - valid values are: PANNING or SELECTION
   */
  setMouseMode = (mode) => {
    switch (mode) {
      case 'PANNING':
        super.installEditPolicy(new draw2d.policy.canvas.PanningSelectionPolicy())
        break
      case 'SELECTION':
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

    super.installEditPolicy(grid)
    super.installEditPolicy(new draw2d.policy.connection.DragConnectionCreatePolicy({
      createConnection: this.createConnection
    }))
  }

  getEditorModel = () => {
    return new EditorModel({
      canUndo: super.getCommandStack().canUndo(),
      canRedo: super.getCommandStack().canRedo(),
      selectionCount: super.getSelection().getSize(),
      mouseMode: this.mouseMode,
      debugMode: this.debugMode,
      oscilloscopeEnabled: this.oscilloscopeEnabled,
      zoomLevel: this.zoomService.getZoomPercentage(),
      circuitComplete: this.circuit.isComplete()
    })
  }

  updateElement = ({ elementId, data }) => {
    super
      .getFigures()
      .asArray()
      .filter(({ id }) => elementId === id)[0]
      .updateSettings(data)
  }

  load = (data) => {
    this.deserializer.deserialize(data)
    this.zoomService.centerAllFigures()
    this.zoomService.panToCenter()
  }

  /**
   * Undo the most recent edit change.
   */
  undo = () => {
    try {
      super.getCommandStack().undo()
    } catch (e) {
      super.getCommandStack().redo()
      super.getCommandStack().undostack = []
    }
  }

  /**
   * Applies the next change in forward (redo) stack.
   */
  redo = () => {
    try {
      super.getCommandStack().redo()
    } catch (e) {
      super.getCommandStack().undo()
      super.getCommandStack().redostack = []
    }
  }

  applyCommand = (command) => {
    this.commandRouter.applyCommand(command)
  }
}
