import BinaryWaveService from './BinaryWaveService'

const BASE_REFRESH_RATE = 100

const MAX_HISTORY_SECONDS = 5

/**
 * @class OscillationManager
 * @description Manages all oscillating services, including binary waves and clock pulses.
 * This manager uses system time (as opposed to the error-prone setInterval() or setTimeout())
 * to determine when a period (defined in `BASE_REFRESH_RATE`) has passed.
 */
export default class OscillationService {
  private interval: number = 0

  private waves: { [id: string]: Pulse } = {}

  private refreshRate: number = BASE_REFRESH_RATE

  private lastUpdateTime: number = Date.now()

  private lastSignalTime: number = 0

  private secondsElapsed: number = 0

  private secondsOffset: number = 0

  private ticks: number = 0

  /**
   * Starts the oscillator.
   */
  start = (): void => {
    this.interval = setInterval(this.tick.bind(this))
  }

  /**
   * Stops the oscillator.
   */
  stop = (): void => {
    clearInterval(this.interval)
  }

  incrementElapsed = (): void => {
    const r = this.refreshRate
    const s = this.secondsElapsed
    const oneSecond = 1000

    this.secondsElapsed = Math.round(r * (s + r / oneSecond)) / r
  }

  computeWaveGeometry = (waves: WaveList) => {
    const displays = {}
    const getPoints = (segments) => segments
      .map(({ x, y }) => `${x},${y}`)
      .join(' ')

    for (let name in waves) {
      if (waves[name].hasGeometry) {
        displays[name] = {
          points: getPoints(waves[name].segments),
          width: waves[name].width
        }
      }
    }

    return displays
  }

  fn: Function = () => {}

  onChange = (fn: Function) => {
    this.fn = fn
  }

  broadcast = () => {
    const MAX_HISTORY_COUNT = 40

    if (this.secondsElapsed - this.secondsOffset >= MAX_HISTORY_COUNT) {
      this.secondsOffset += MAX_HISTORY_COUNT / 2

      Object
        .values(this.waves)
        .forEach((wave: Pulse) => {
          if (wave instanceof BinaryWaveService) {
            wave.truncateSegments(MAX_HISTORY_COUNT / 2)
          }
        })
    }

    this.fn({
      waves: this.computeWaveGeometry(this.waves),
      secondsElapsed: this.secondsElapsed,
      secondsOffset: this.secondsOffset
    })
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
      this.broadcast()
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
   * @param {Pulse} wave
   */
  add = (wave: Pulse): void => {
    if (!this.waves.hasOwnProperty(wave.id)) {
      this.waves[wave.id] = wave
    }
  }

  /**
   * Removes the wave having the given id.
   *
   * @param {Pulse} wave
   */
  remove = ({ id }: Pulse): void => {
    delete this.waves[id]
  }
}