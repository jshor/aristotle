import IntervalWorkerService from './IntervalWorkerService'

const BASE_REFRESH_RATE = 100

export default class OscillationService {
  constructor (editor) {
    this.interval = new IntervalWorkerService()
    this.waves = {}
    this.refreshRate = BASE_REFRESH_RATE
    this.editor = editor
    this.lastUpdateTime = Date.now()
    this.lastSignalTime = 0
    this.secondsElapsed = 0
    this.ticks = 0
    this.interval.onTick(this.tick.bind(this))

    // setTimeout(this.interval.stop.bind(this), 20000) // temporary, for dev purposes
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

  incrementElapsed = () => {
    const r = this.refreshRate
    const s = this.secondsElapsed
    const oneSecond = 1000

    this.secondsElapsed = Math.round(r * (s + r / oneSecond)) / r
  }

  computeWaveGeometry = () => {
    const displays = {}
    const getPoints = ({ segments }) => segments
        .map(({ x, y }) => `${x},${y}`)
        .join(' ')

    for (let name in this.waves) {
      if (this.waves[name].segments) {
        displays[name] = {
          points: getPoints(this.waves[name]),
          width: this.waves[name].width
        }
      }
    }

    return displays
  }

  /**
   * Triggers all oscillation update events.
   */
  tick = () => {
    const now = Date.now()

    if (now >= this.lastUpdateTime + this.refreshRate) {
      this.update(++this.ticks)
      this.lastUpdateTime = now
      this.incrementElapsed()
    }

    if (this.secondsElapsed % 1 === 0 && this.lastSignalTime !== this.secondsElapsed) {
      this.lastSignalTime = this.secondsElapsed
  
      this.editor.oscillate(this.computeWaveGeometry(), this.secondsElapsed)
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
    if (!this.waves.hasOwnProperty(wave.id)) {
      this.waves[wave.id] = wave
    }
  }

  /**
   * Removes the wave having the given id.
   *
   * @param {String} waveId
   */
  remove = ({ id }) => {
    delete this.waves[id]
  }
}
