import { LogicValue } from '@aristotle/logic-circuit'
import ToggleService from '../services/ToggleService'
import Element from '../Element'

export default class IOElement extends Element {
  constructor (id, params) {
    super(id, params)

    this.on('added', this.registerWave)
    this.on('added', this.setInitialValue)
    this.on('removed', this.unregisterWave)
  }

  settings = {
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
        0: 'Hide',
        1: 'Show'
      },
      value: 1,
      onUpdate: () => this.resetWave()
    }
  }

  setInitialValue = () => {
    this.setValue(this.settings.startValue.value)
  }

  resetWave = () => {
    if (this.settings.oscilloscope.value === '0') {
      this.unregisterWave()
    } else {
      this.registerWave()
    }
  }

  unregisterWave = () => {
    this.oscillation.remove(this.wave)
  }

  registerWave = () => {
    this.wave = new ToggleService(this.id)

    if (this.canvas) {
      this.oscillation = this.canvas.oscillation
      this.oscillation.add(this.wave)
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
      this.canvas.fireEvent('commandStackChanged') // TODO: rename this event
    }
    this.render()
  }

  invertValue = () => {
    const newValue = this.node.getProjectedValue() === LogicValue.TRUE
      ? LogicValue.FALSE
      : LogicValue.TRUE

    this.setValue(newValue)
  }
}
