import { TinyEmitter } from 'tiny-emitter'
import BinaryWaveService from './BinaryWaveService'

/**
 * @class OscillationService
 * @description Manages all oscillating services, including binary waves and clock pulses.
 * This service uses system time to determine proper sequencing and updating.
 */
export default class OscillationService {
  /** Whether or not the oscillator is paused. */
  public isPaused: boolean = true

  /** Key-value pair of all waves. */
  public waves: Record<string, Pulse> = {}

  /** The refresh rate for the oscilloscope. */
  public refreshRate: number = 20 // TODO: this can be configured to make the waves wider/oscilloscope run faster

  /** The last time the oscillator was updated, in milliseconds. */
  public lastUpdateTime: number = Date.now()

  /** Elapsed total time, in milliseconds. */
  public timeMsElapsed: number = 0

  /** Offset wave time, in milliseconds. */
  public timeMsOffset: number = 0

  /** Event emitter. */
  private emitter: TinyEmitter = new TinyEmitter()

  /**
   * Starts the oscillator.
   */
  start = () => {
    if (!this.isPaused) return

    // this is the time that has elapsed prior to the completion of a full period
    // when the oscillator is stopped, we want to maintain the time progressed before the next period
    const remainingPeriodTime = this.lastUpdateTime % this.refreshRate

    this.lastUpdateTime = Date.now() + remainingPeriodTime
    this.isPaused = false
    this.tick()
  }

  /**
   * Stops the oscillator.
   */
  stop = () => {
    this.isPaused = true
  }

  /**
   * Clears all current binary wave geometries.
   */
  clear = () => {
    Object
      .values(this.waves)
      .forEach(wave => {
        if (wave instanceof BinaryWaveService) {
          (wave as BinaryWaveService).reset()
        }
      })
  }

  /**
   * Computes the SVG points for each given binary wave.
   *
   * @param waves
   * @returns oscillogram result
   */
  computeWaveGeometry = (waves: Record<string, Pulse>) => {
    const displays: Oscillogram = {}
    const getPoints = (segments: Point[]): string => segments
      .map(({ x, y }) => `${x},${y}`)
      .join(' ')

    for (const name in waves) {
      if (waves[name] instanceof BinaryWaveService) {
        const wave = waves[name] as BinaryWaveService

        displays[name] = {
          points: getPoints(wave.segments),
          width: wave.width,
          hue: wave.hue
        }
      }
    }

    return displays
  }

  /**
   * Event listener.
   *
   * @param event - available values: `change`
   * @param fn - callback function, taking the oscillogram data as its sole argument
   */
  on = (event: string, fn: (oscillogram: Oscillogram) => void) => {
    this.emitter.on(event, fn)
  }

  /**
   * Broadcasts the oscillogram.
   *
   * @emits change containing the oscillogram data
   */
  broadcast = () => {
    // set the max history to be twice the size of the user's screen, then cut half of it when it is exceeded
    const widthOfOneSecond = 1000 / this.refreshRate
    const maxHistorySeconds = (window.screen.width * 2) / widthOfOneSecond

    if ((this.timeMsElapsed / 1000) - this.timeMsOffset >= maxHistorySeconds) {
      const remainingSeconds = Math.max(maxHistorySeconds / 2, window.innerWidth / widthOfOneSecond)

      this.timeMsOffset += remainingSeconds

      Object
        .values(this.waves)
        .forEach((wave: Pulse) => {
          if (wave instanceof BinaryWaveService) {
            wave.truncateSegments(remainingSeconds * widthOfOneSecond)
          }
        })
    }

    this.emitter.emit('change', this.computeWaveGeometry(this.waves))
  }

  /**
   * Triggers all oscillation update events.
   */
  tick = (): void => {
    if (this.isPaused) return

    const now = Date.now()
    const MAX_IDLE_TIME = 10000 // 10 seconds
    let hasUpdated = false

    if (now >= this.lastUpdateTime + MAX_IDLE_TIME) {
      // if the oscilloscope has been idle for a while, then re-start it rather than try to catch up to the current time
      this.stop()
      this.start()
      return
    }

    while (now >= this.lastUpdateTime + this.refreshRate) {
      // loop through each refresh period elapsed and simulate as if they actually elapsed
      const delta = Math.min(this.refreshRate, now - this.lastUpdateTime)

      hasUpdated = true
      this.timeMsElapsed += delta
      this.lastUpdateTime += delta
      this.update()
    }

    if (hasUpdated) {
      this.broadcast()
    }

    requestAnimationFrame(this.tick)
  }

  /**
   * Updates all waves with the given tick count.
   */
  update = (): void => {
    Object
      .values(this.waves)
      .forEach((wave) => wave.update(this.timeMsElapsed))
  }

  /**
   * Adds the given wave to the oscillator instance.
   *
   * @param {Pulse} wave
   */
  add = (wave: Pulse): void => {
    if (!this.waves.hasOwnProperty(wave.id)) {
      this.waves[wave.id] = wave

      if (this.timeMsElapsed === 0) {
        this.broadcast()
      }
    }
  }

  /**
   * Removes the wave having the given id.
   *
   * @param {Pulse} wave
   */
  remove = ({ id }: Pulse): void => {
    delete this.waves[id]

    if (Object.keys(this.waves).length === 0) {
      this.stop()
      this.clear()
    }
  }
}
