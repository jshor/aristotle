import { LogicValue } from '@aristotle/logic-circuit'
import Switch from './Switch'
import WaveService from '../services/WaveService'

export default class Clock extends Switch {
  constructor (id) {
    super(id)

    const val = parseInt(Math.random() * 40) * 100
    console.log('val: ', val)
    this.wave = new WaveService(id, val)
    this.wave.onUpdate(this.pulse)

    this.on('added', this.registerWave)
  }

  registerWave = () => {
    this.canvas.oscillation.add(this.wave)
  }

  doToggle = () => {
    // 
  }

  pulse = (value) => {
    const newValue = this.node.value === LogicValue.TRUE ? LogicValue.FALSE : LogicValue.TRUE

    this.toggle(newValue)
  }
}