import { LogicValue } from '@aristotle/logic-circuit'
import Switch from './Switch'
import WaveService from '../services/WaveService'

export default class Clock extends Switch {
  constructor (id) {
    super(id)

    const val = 1000 // parseInt(Math.random() * 40) * 100
    this.wave = new WaveService(id, val)
    this.wave.onUpdate(this.toggle)
    this.remove(this.clickableArea)

    this.on('added', this.registerWave)
  }

  registerWave = () => {
    this.canvas.oscillation.add(this.wave)
  }
}