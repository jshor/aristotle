const BASE_INTERVAL = 1000
const SIGNAL_HEIGHT = 40
const SEGMENT_WIDTH = 2 // px per refresh rate

export default class OscillationService {
  constructor (editor) {
    this.waves = {}
    // refreshRate (ms) -- must be a number that all pulses are divisible by
    // TODO: calculate this dynamically...?
    this.refreshRate = 100
    this.editor = editor
    this.ticks = 0
    this.lastSignal = 0
    this.lastUpdate = Date.now()
  }
  
  start = () => {
    this.interval = setInterval(this.tick)
  }
  
  stop = () => {
    clearInterval(this.interval)
  }
  
  tick = () => {
    const now = Date.now()
    
    if (now >= this.lastUpdate + this.refreshRate) {
      this.update(++this.ticks)
      this.lastUpdate = now
    }

    if (this.lastSignal % 10 === 0) {
      this.lastSignal = 0
      this.editor.oscillate(this.waves)
    } else {
      this.lastSignal++
    }
  }
  
  update = (ticks) => {
    Object
      .values(this.waves)
      .forEach((wave) => wave.update(ticks))
  }
  
  add = (wave) => {
    this.waves[wave.id] = wave
    this.waves[wave.id].interval = wave.interval / this.refreshRate
  }
  
  remove = (waveId) => {
    delete this.waves[waveId]
  }
}