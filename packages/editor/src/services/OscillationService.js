import IntervalWorkerService from './IntervalWorkerService'

const BASE_REFRESH_RATE = 100

export default class OscillationService {
  constructor (editor) {
    this.interval = new IntervalWorkerService()
    this.waves = {}
    this.refreshRate = BASE_REFRESH_RATE
    this.editor = editor
    this.ticks = 0
    this.lastSignal = 0
    this.lastUpdate = Date.now()
    this.interval.onTick(this.tick.bind(this))

    setTimeout(this.interval.stop.bind(this), 20000)
  }

  /**
   * Starts the oscillator.
   */
  start = () => {
    this.interval.start()
  }

  /**
   * Stops the oscillator.
   */
  stop = () => {
    this.interval.stop()
  }

  /**
   * Triggers all oscillation update events.
   */
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

  /**
   * Updates all waves with the given tick count.
   *
   * @param {Number} ticks - number of tick periods accrued
   */
  update = (ticks) => {
    Object
      .values(this.waves)
      .forEach((wave) => wave.update(ticks))
  }

  /**
   * Adds the given wave to the oscillator instance.
   *
   * @param {Wave} wave
   */
  add = (wave) => {
    this.waves[wave.id] = wave
    this.waves[wave.id].interval = wave.interval / this.refreshRate
  }

  /**
   * Removes the wave having the given id.
   *
   * @param {String} waveId
   */
  remove = (waveId) => {
    delete this.waves[waveId]
  }
}
