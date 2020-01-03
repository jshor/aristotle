import IntervalWorkerService from './IntervalWorkerService'
import Editor from '../Editor'
import IPulse from '../interfaces/IPulse'

const BASE_REFRESH_RATE = 100

export default class OscillationService {
  private interval: IntervalWorkerService = new IntervalWorkerService()

  private waves: { [id: string]: IPulse } = {}

  private refreshRate: number = BASE_REFRESH_RATE

  private editor: Editor

  private lastUpdateTime: number

  private lastSignalTime: number = 0

  private secondsElapsed: number = 0

  private ticks: number = 0

  constructor (editor: Editor) {
    this.editor = editor
    this.lastUpdateTime = Date.now()
    this.interval.onTick(this.tick.bind(this))

    // setTimeout(this.interval.stop.bind(this), 20000) // temporary, for dev purposes
  }

  /**
   * Starts the oscillator.
   */
  start = (): void => {
    this.interval.start()
  }

  /**
   * Stops the oscillator.
   */
  stop = (): void => {
    this.interval.stop()
  }

  incrementElapsed = (): void => {
    const r = this.refreshRate
    const s = this.secondsElapsed
    const oneSecond = 1000

    this.secondsElapsed = Math.round(r * (s + r / oneSecond)) / r
  }

  computeWaveGeometry = () => {
    const displays = {}
    const getPoints = (segments) => segments
        .map(({ x, y }) => `${x},${y}`)
        .join(' ')

    for (let name in this.waves) {
      if (this.waves[name].hasGeometry) {
        displays[name] = {
          points: getPoints(this.waves[name].segments),
          width: this.waves[name].width
        }
      }
    }

    return displays
  }

  /**
   * Triggers all oscillation update events.
   */
  tick = (): void => {
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
  update = (ticks: number): void => {
    Object
      .values(this.waves)
      .forEach((wave) => wave.update(ticks))
  }

  /**
   * Adds the given wave to the oscillator instance.
   *
   * @param {IPulse} wave
   */
  add = (wave: IPulse): void => {
    if (!this.waves.hasOwnProperty(wave.id)) {
      this.waves[wave.id] = wave
    }
  }

  /**
   * Removes the wave having the given id.
   *
   * @param {IPulse} wave
   */
  remove = ({ id }: IPulse): void => {
    delete this.waves[id]
  }
}
