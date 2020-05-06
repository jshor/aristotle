import draw2d from 'draw2d'
import { LogicValue } from '@aristotle/logic-circuit'
import ToggleService from '../services/ToggleService'
import OscillationManager from '../managers/OscillationManager'
import Element from '../core/Element'
import IElementProperties from '../interfaces/IElementProperties'
import { ElementPropertyValues } from '../types'
import uuid from '../utils/uuid'

export default class IOElement extends Element {
  public nodeType: string = 'input'

  public wave: ToggleService

  private oscillation: OscillationManager

  constructor (id: string, properties: ElementPropertyValues) {
    super(id, properties)

    this.on('added', this.registerWave)
    this.on('added', this.setInitialValue) // TODO
    this.on('removed', this.unregisterWave)
  }

  public properties: IElementProperties = {
    name: {
      type: 'text',
      value: ''
    },
    startValue: {
      type: 'select',
      options: {
        [LogicValue.TRUE]: 'High',
        [LogicValue.FALSE]: 'Low'
      },
      value: LogicValue.FALSE
    },
    oscilloscope: {
      type: 'select',
      options: {
        '0': 'Hide',
        '1': 'Show'
      },
      value: '1',
      onUpdate: () => this.resetWave()
    }
  }

  setInitialValue = () => {
    this.setValue(this.properties.startValue.value)
  }

  resetWave = () => {
    if (this.properties.oscilloscope.value === '0') {
      this.unregisterWave()
    } else {
      this.registerWave()
    }
  }

  unregisterWave = () => {
    this.oscillation.remove(this.wave)
  }

  registerWave = () => {
    this.wave = new ToggleService(this.getId())

    if (this.canvas) {
      this.oscillation = this.canvas.oscillation
      this.canvas.oscillation.add(this.wave)
    }
  }

  setValue = (newValue) => {
    this.node.setValue(newValue)
    this.wave.drawPulseChange(newValue)

    // input nodes changes require triggering the head of the circuit queue
    this.canvas.circuit.queue.push(this.node)

    if (!this.canvas.debugMode) {
      this.canvas.step(true)
    } else {
      // if the editor is in debug mode, tell the user the circuit evaluation is incomplete
      this.canvas.fireEvent('circuit:changed')
    }
    this.render()
  }

  invertValue = () => {
    const newValue = this.node.getProjectedValue() === LogicValue.TRUE
      ? LogicValue.FALSE
      : LogicValue.TRUE

    this.setValue(newValue)
  }

  public serialize = () => {
    const figure: draw2d.Figure = this as draw2d.Figure

    return {
      id: figure.getId(),
      x: figure.getX(),
      y: figure.getY(),
      type: this.constructor.name,
      nodeType: this.nodeType,
      name: uuid(),
      properties: this.serializeProperties()
    }
  }
}
